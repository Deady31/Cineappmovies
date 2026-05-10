'use client';

import { useEffect, useState, useRef } from 'react';
import { Film, Popcorn, MapPin, Search, ChevronDown, Check } from 'lucide-react';
import type { Movie } from './api/movies/route';
import type { Platform } from './api/movies/route';
import { MovieCard } from '@/components/MovieCard';

type PatheTab = 'now_playing' | 'upcoming';
type SortOption = 'release_desc' | 'release_asc' | 'popularity' | 'vote_desc';

const PLATFORM_LABELS: Record<Platform, string> = {
  pathe: 'Cinéma',
  netflix: 'Netflix',
  prime: 'Prime Video',
  disney: 'Disney+'
};

const SORT_LABELS: Record<SortOption, string> = {
  release_desc: 'Plus récents',
  release_asc: 'Plus anciens',
  popularity: 'Plus populaires',
  vote_desc: 'Mieux notés'
};

const CITIES = [
  'Toulouse', 'Lyon', 'Paris', 'Bordeaux', 'Marseille',
  'Lille', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier'
];

export type Cinema = { name: string; code: string };

export const CINEMAS_BY_CITY: Record<string, Cinema[]> = {
  Toulouse: [
    { name: 'Pathé Wilson', code: 'P0057' },
    { name: 'UGC Montaudran', code: 'W2920' },
    { name: 'Pathé Labège', code: 'P0645' },
    { name: 'ABC', code: 'R0121' },
    { name: 'Utopia Borderouge', code: 'mock1' },
    { name: 'American Cosmograph', code: 'mock2' },
    { name: 'Le Cratère', code: 'mock3' },
  ],
  Lyon: [
    { name: 'Pathé Bellecour', code: 'mock4' },
    { name: 'UGC Confluence', code: 'mock5' },
    { name: 'CGR Ciné Alpes', code: 'mock6' },
  ],
  Paris: [
    { name: 'Pathé Trocadéro', code: 'mock7' },
    { name: 'UGC Ciné Cité Les Halles', code: 'mock8' },
    { name: 'Pathé La Villette', code: 'mock9' },
  ],
};

CITIES.forEach((city) => {
  if (!CINEMAS_BY_CITY[city]) {
    CINEMAS_BY_CITY[city] = [
      { name: `Multiplexe Central ${city}`, code: `mock1-${city}` },
      { name: `Cinéma Indépendant ${city}`, code: `mock2-${city}` },
      { name: `Le Méliès ${city}`, code: `mock3-${city}` },
    ];
  }
});

interface MoviesResponse {
  movies: Movie[];
}

export default function HomePage() {
  const [platform, setPlatform] = useState<Platform>('pathe');
  const [patheTab, setPatheTab] = useState<PatheTab>('now_playing');
  const [sort, setSort] = useState<SortOption>('release_desc');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States pour Ville et Cinéma
  const [city, setCity] = useState<string>('Toulouse');
  const [cityInput, setCityInput] = useState<string>('Toulouse');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [cinema, setCinema] = useState<Cinema>(CINEMAS_BY_CITY['Toulouse'][0]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown au clic ext.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hydratation depuis localStorage
  useEffect(() => {
    const savedCity = localStorage.getItem('preferredCity') || 'Toulouse';
    if (CITIES.includes(savedCity)) {
      setCity(savedCity);
      setCityInput(savedCity);
      const savedCinemaCode = localStorage.getItem('preferredCinema');
      const cityCinemas = CINEMAS_BY_CITY[savedCity];
      const foundCinema = cityCinemas.find((c) => c.code === savedCinemaCode);
      setCinema(foundCinema || cityCinemas[0]);
    }
  }, []);

  const handleCitySelect = (newCity: string) => {
    setCity(newCity);
    setCityInput(newCity);
    localStorage.setItem('preferredCity', newCity);

    const newCinema = CINEMAS_BY_CITY[newCity][0];
    setCinema(newCinema);
    localStorage.setItem('preferredCinema', newCinema.code);
    setShowCityDropdown(false);
  };

  const handleCinemaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const newCinema = CINEMAS_BY_CITY[city].find(c => c.code === code);
    if (newCinema) {
      setCinema(newCinema);
      localStorage.setItem('preferredCinema', newCinema.code);
    }
  };

  const filteredCities = CITIES.filter(c => c.toLowerCase().includes(cityInput.toLowerCase()));

  useEffect(() => {
    let isCancelled = false;

    async function loadMovies() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('platform', platform);
      if (platform === 'pathe') {
        params.set('type', patheTab);
        params.set('cinema', cinema.code);
      } else {
        params.set('sort', sort);
      }

      try {
        const response = await fetch(`/api/movies?${params}`, {
          method: 'GET',
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des films.');
        }

        const data: MoviesResponse = await response.json();
        if (!isCancelled) {
          setMovies(data.movies);
          const genresSet = new Set<string>();
          data.movies.forEach((m) => m.genres.forEach((g) => genresSet.add(g)));
          setAvailableGenres(Array.from(genresSet).sort());
          setSelectedGenre('all');
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Une erreur inattendue est survenue.'
          );
          setMovies([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadMovies();

    return () => {
      isCancelled = true;
    };
  }, [platform, patheTab, sort, cinema.code]);

  const filteredMovies =
    selectedGenre === 'all'
      ? movies
      : movies.filter((m) => m.genres.includes(selectedGenre));

  return (
    <main className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_#ff002e_0,_#000000_55%,#000000_100%)] px-4 pb-10 pt-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] mix-blend-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,#ffffff_0,#ffffff_8%,transparent_40%),radial-gradient(circle_at_90%_100%,#ffea00_0,#ffea00_6%,transparent_40%),repeating-linear-gradient(135deg,rgba(0,0,0,0.8)_0,rgba(0,0,0,0.8)_3px,rgba(255,255,255,0.12)_3px,rgba(255,255,255,0.12)_6px)]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-4">
              <div className="inline-flex max-w-max items-center gap-2 rounded-full border border-white/30 bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-black/60">
                <Popcorn className="h-3.5 w-3.5 text-primary-400" />
                <span>Films · Cinéma & Streaming</span>
              </div>
              <div>
                <h1 className="relative inline-flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  <div className="flex h-11 w-11 -skew-x-6 items-center justify-center rounded-[1.1rem] border border-white bg-black shadow-[0_0_0_2px_#000,0_0_0_5px_#ffffff]">
                    <Film className="h-5 w-5 text-primary-500" />
                  </div>
                  <div className="flex flex-col -skew-x-6">
                    <span className="bg-black px-3 py-1 text-lg font-extrabold uppercase tracking-[0.16em] text-white shadow-[4px_4px_0_#ffea00] sm:text-xl">
                      CinéAppMovies
                    </span>
                    <span className="mt-1 inline-block bg-primary-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.3em] text-black">
                      Cinéma {cinema.name} · Netflix · Prime · Disney+
                    </span>
                  </div>
                </h1>
                <p className="mt-3 max-w-xl text-sm text-slate-100/85">
                  Découvrez les films à l&apos;affiche au {cinema.name} et
                  les dernières sorties sur Netflix, Prime Video et Disney+.
                </p>
              </div>
            </div>

            {/* Sélecteur de ville et de cinéma */}
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/50 p-3 shadow-lg backdrop-blur-md md:min-w-[280px]">
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-black px-3 py-2 focus-within:border-primary-500">
                  <MapPin className="h-4 w-4 text-primary-500" />
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => {
                      setCityInput(e.target.value);
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    placeholder="Chercher une ville..."
                    className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
                  />
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
                {showCityDropdown && (
                  <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-white/20 bg-black/95 py-1 shadow-xl backdrop-blur-xl">
                    {filteredCities.length > 0 ? (
                      filteredCities.map(c => (
                        <button
                          key={c}
                          onClick={() => handleCitySelect(c)}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                        >
                          {c}
                          {c === city && <Check className="h-4 w-4 text-primary-500" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-500">Aucune ville trouvée</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-black px-3 py-2">
                <Film className="h-4 w-4 text-primary-500" />
                <select
                  value={cinema.code}
                  onChange={handleCinemaChange}
                  className="w-full bg-transparent text-sm font-medium text-white outline-none"
                >
                  {CINEMAS_BY_CITY[city]?.map(c => (
                    <option key={c.code} value={c.code} className="bg-black text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        <section className="glass-panel flex flex-col gap-4 border-white/10 bg-black/70 p-3 sm:p-4">
          {/* Onglets plateformes */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
              Plateforme
            </span>
            <div className="flex flex-wrap gap-2">
              {(['pathe', 'netflix', 'prime', 'disney'] as Platform[]).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition ${platform === p
                      ? 'border-primary-500 bg-primary-500 text-black'
                      : 'border-white/30 bg-white/5 text-slate-200 hover:bg-white/10'
                      }`}
                  >
                    {PLATFORM_LABELS[p]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Sous-onglets Pathé ou Tri streaming */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            {platform === 'pathe' ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-1 py-1 text-xs font-black uppercase tracking-[0.16em] text-black">
                <button
                  type="button"
                  className={`tab-button ${patheTab === 'now_playing'
                    ? 'tab-button-active'
                    : 'tab-button-inactive'
                    }`}
                  onClick={() => setPatheTab('now_playing')}
                >
                  À l&apos;affiche
                </button>
                <button
                  type="button"
                  className={`tab-button ${patheTab === 'upcoming'
                    ? 'tab-button-active'
                    : 'tab-button-inactive'
                    }`}
                  onClick={() => setPatheTab('upcoming')}
                >
                  Prochains
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
                  Trier
                </span>
                <select
                  value={sort}
                  onChange={(e) =>
                    setSort(e.target.value as SortOption)
                  }
                  className="rounded-full border border-white/30 bg-black/60 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
                    <option key={s} value={s} className="bg-black text-white">
                      {SORT_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-200">
              Données temps réel · TMDb
            </p>
          </div>

          {/* Filtres genres */}
          {availableGenres.length > 0 && !loading && !error && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
              <span className="text-[11px] uppercase tracking-wide text-slate-500">
                Type de film
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGenre('all')}
                  className={`rounded-full border px-3 py-1 transition ${selectedGenre === 'all'
                    ? 'border-primary-500 bg-primary-500/20 text-primary-100'
                    : 'border-slate-700/70 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:text-slate-50'
                    }`}
                >
                  Tous
                </button>
                {availableGenres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setSelectedGenre(genre)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${selectedGenre === genre
                      ? 'border-primary-500 bg-primary-500/25 text-primary-50'
                      : 'border-slate-800/80 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-slate-50'
                      }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-1 items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-300">
                <span className="inline-flex h-10 w-10 animate-spin rounded-full border-[3px] border-primary-500 border-t-transparent" />
                <p className="text-sm">
                  Chargement des films {platform === 'pathe' ? `à l'affiche...` : `sur ${PLATFORM_LABELS[platform]}...`}
                </p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-1 items-center justify-center py-10">
              <div className="max-w-md space-y-3 text-center">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {error}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Vérifiez votre connexion ou réessayez dans quelques minutes.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && filteredMovies.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-10">
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Aucun film à afficher pour le moment.
              </p>
            </div>
          )}

          {!loading && !error && filteredMovies.length > 0 && (
            <div className="grid gap-4 pt-1 sm:grid-cols-2 lg:grid-cols-4">
              {filteredMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} cinema={cinema} />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-4 flex flex-col items-center justify-between gap-2 text-[11px] text-slate-500 sm:flex-row dark:text-slate-400">
          <p>
            Données fournies par TMDb. Ce projet n&apos;est pas affilié à Pathé
            Gaumont, Netflix, Amazon ou Disney.
          </p>
          <p>
            Pathé Wilson Toulouse · Netflix · Prime Video · Disney+ ·{' '}
            <span className="font-medium">Next.js · Tailwind CSS</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
