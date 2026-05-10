import { NextRequest, NextResponse } from 'next/server';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export type Platform = 'pathe' | 'netflix' | 'prime' | 'disney';
type PatheType = 'now_playing' | 'upcoming';
type SortOption =
  | 'release_desc'
  | 'release_asc'
  | 'popularity'
  | 'vote_desc';

// IDs de watch providers TMDb pour la France (JustWatch)
// Netflix: 8, Prime Video: 9 ou 119 (duplicata), Disney+: 337
const WATCH_PROVIDER_IDS: Record<Exclude<Platform, 'pathe'>, string> = {
  netflix: '8',
  prime: '9|119',
  disney: '337'
};

const SORT_MAP: Record<SortOption, string> = {
  release_desc: 'primary_release_date.desc',
  release_asc: 'primary_release_date.asc',
  popularity: 'popularity.desc',
  vote_desc: 'vote_average.desc'
};

export interface MovieCastMember {
  id: number;
  name: string;
  character: string;
  profileUrl: string | null;
}

export interface Showtime {
  time: string;
  link: string;
  roomType?: string; // IMAX, 4DX, ScreenX, etc.
  version?: string; // VF, VOST, etc.
  isSoldOut?: boolean;
  price?: string;
  attributes?: string[]; // 3D, HFR, Atmos, etc.
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  releaseDate: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  runtime: number | null;
  cast: MovieCastMember[];
  trailerYoutubeKey: string | null;
  voteAverage: number | null;
  genres: string[];
  originalLanguage: string | null;
  platform?: Platform;
  showtimes?: Showtime[];
  director?: string;
  ageRating?: string;
  cinemaUrl?: string; // URL directe du cinéma
}

async function fetchJson<T>(url: string): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error(
      "La variable d'environnement TMDB_API_KEY est manquante. Vérifiez votre fichier .env.local."
    );
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json;charset=utf-8'
    },
    // Toujours en temps réel côté serveur
    cache: 'no-store'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erreur TMDb (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

async function getMovies(type: PatheType, cinemaCode?: string | null): Promise<Movie[]> {
  // On récupère 2 pages de TMDb pour avoir du choix (40 films locaux/globaux)
  const url1 = `${TMDB_BASE_URL}/movie/${type}?language=fr-FR&region=FR&page=1`;
  const url2 = `${TMDB_BASE_URL}/movie/${type}?language=fr-FR&region=FR&page=2`;

  type TMDbMoviesResponse = {
    results: {
      id: number;
      title: string;
      overview: string;
      release_date: string;
      poster_path: string | null;
      backdrop_path: string | null;
      adult: boolean;
    }[];
  };

  const [list1, list2] = await Promise.all([
    fetchJson<TMDbMoviesResponse>(url1),
    fetchJson<TMDbMoviesResponse>(url2).catch(() => ({ results: [] }))
  ]);

  let allMovies = [...list1.results, ...list2.results].filter((movie) => !movie.adult);

  // Rendre la liste de films unique à chaque cinéma grâce à un seed basé sur son code.
  if (cinemaCode) {
    const hash = Array.from(cinemaCode).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    allMovies = allMovies.sort((a, b) => {
      const aHash = (a.id + hash) % 40;
      const bHash = (b.id + hash) % 40;
      return aHash - bHash;
    });
  }

  const topMovies = allMovies.slice(0, 10);

  const detailedMovies = await Promise.all(
    topMovies.map(async (movie) => {
      type TMDbDetailsResponse = {
        runtime: number | null;
        vote_average?: number;
        original_language?: string;
        genres?: { id: number; name: string }[];
        videos?: {
          results: { key: string; name: string; site: string; type: string; official: boolean }[];
        };
        credits?: { cast: { id: number; name: string; character: string; profile_path: string | null }[] };
      };

      const detailsUrl = `${TMDB_BASE_URL}/movie/${movie.id}?language=fr-FR&append_to_response=videos,credits`;
      // On wrap l'appel détails pour ne pas tout crasher si 1 film pose problème
      const details = await fetchJson<TMDbDetailsResponse>(detailsUrl).catch(() => ({} as TMDbDetailsResponse));

      const trailer =
        details.videos?.results?.find(
          (video) => video.site === 'YouTube' && video.type === 'Trailer' && video.official
        ) ??
        details.videos?.results?.find(
          (video) => video.site === 'YouTube' && video.type === 'Trailer'
        ) ??
        null;

      const cast: MovieCastMember[] =
        details.credits?.cast?.slice(0, 8).map((member) => ({
          id: member.id,
          name: member.name,
          character: member.character,
          profileUrl: member.profile_path ? `${TMDB_IMAGE_BASE_URL}${member.profile_path}` : null
        })) ?? [];

      const genres = details.genres?.map((genre) => genre.name).filter(Boolean) ?? [];

      return {
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        releaseDate: movie.release_date,
        posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
        backdropUrl: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}` : null,
        runtime: details.runtime ?? null,
        cast,
        trailerYoutubeKey: trailer ? trailer.key : null,
        voteAverage: typeof details.vote_average === 'number' ? details.vote_average : null,
        genres,
        originalLanguage: details.original_language ?? null,
        platform: 'pathe'
      } satisfies Movie;
    })
  );

  return detailedMovies;
}

async function getStreamingMovies(
  platform: Exclude<Platform, 'pathe'>,
  sort: SortOption
): Promise<Movie[]> {
  const providerId = WATCH_PROVIDER_IDS[platform];
  const sortBy = SORT_MAP[sort];
  const url = `${TMDB_BASE_URL}/discover/movie?language=fr-FR&region=FR&watch_region=FR&with_watch_providers=${providerId}&sort_by=${sortBy}&page=1&vote_count.gte=30&with_watch_monetization_types=flatrate`;

  type TMDbDiscoverResponse = {
    results: {
      id: number;
      title: string;
      overview: string;
      release_date: string;
      poster_path: string | null;
      backdrop_path: string | null;
      adult: boolean;
    }[];
  };

  const list = await fetchJson<TMDbDiscoverResponse>(url);
  const top = list.results.filter((m) => !m.adult).slice(0, 12);

  const detailedMovies = await Promise.all(
    top.map(async (movie) => {
      type TMDbDetailsResponse = {
        runtime: number | null;
        vote_average?: number;
        original_language?: string;
        genres?: { id: number; name: string }[];
        videos?: {
          results: { key: string; site: string; type: string; official: boolean }[];
        };
        credits?: {
          cast: {
            id: number;
            name: string;
            character: string;
            profile_path: string | null;
          }[];
        };
      };

      const detailsUrl = `${TMDB_BASE_URL}/movie/${movie.id}?language=fr-FR&append_to_response=videos,credits`;
      const details = await fetchJson<TMDbDetailsResponse>(detailsUrl);

      const trailer =
        details.videos?.results.find(
          (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official
        ) ??
        details.videos?.results.find(
          (v) => v.site === 'YouTube' && v.type === 'Trailer'
        ) ??
        null;

      const cast: MovieCastMember[] =
        details.credits?.cast.slice(0, 8).map((m) => ({
          id: m.id,
          name: m.name,
          character: m.character,
          profileUrl: m.profile_path
            ? `${TMDB_IMAGE_BASE_URL}${m.profile_path}`
            : null
        })) ?? [];

      const genres = details.genres?.map((g) => g.name).filter(Boolean) ?? [];

      return {
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        releaseDate: movie.release_date,
        posterUrl: movie.poster_path
          ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
          : null,
        backdropUrl: movie.backdrop_path
          ? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}`
          : null,
        runtime: details.runtime ?? null,
        cast,
        trailerYoutubeKey: trailer ? trailer.key : null,
        voteAverage:
          typeof details.vote_average === 'number' ? details.vote_average : null,
        genres,
        originalLanguage: details.original_language ?? null,
        platform
      } satisfies Movie;
    })
  );

  return detailedMovies;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platformParam = searchParams.get('platform') as Platform | null;
  const platform: Platform =
    platformParam && ['pathe', 'netflix', 'prime', 'disney'].includes(platformParam)
      ? platformParam
      : 'pathe';

  const typeParam = searchParams.get('type') as PatheType | null;
  const type: PatheType = typeParam === 'upcoming' ? 'upcoming' : 'now_playing';

  const cinemaCode = searchParams.get('cinema');

  const sortParam = searchParams.get('sort') as SortOption | null;
  const sort: SortOption =
    sortParam && ['release_desc', 'release_asc', 'popularity', 'vote_desc'].includes(sortParam)
      ? sortParam
      : 'release_desc';

  try {
    let movies: Movie[] = [];
    if (platform === 'pathe') {
      movies = await getMovies(type, cinemaCode);
    } else {
      movies = await getStreamingMovies(platform, sort);
    }

    return NextResponse.json({ movies });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message:
          "Impossible de récupérer les films pour le moment. Merci de réessayer plus tard."
      },
      { status: 500 }
    );
  }
}

