module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/movies/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
// IDs de watch providers TMDb pour la France (JustWatch)
// Netflix: 8, Prime Video: 9 ou 119 (duplicata), Disney+: 337
const WATCH_PROVIDER_IDS = {
    netflix: '8',
    prime: '9|119',
    disney: '337'
};
const SORT_MAP = {
    release_desc: 'primary_release_date.desc',
    release_asc: 'primary_release_date.asc',
    popularity: 'popularity.desc',
    vote_desc: 'vote_average.desc'
};
const PATHE_CINEMA_URLS = {
    'P0057': 'https://www.pathe.fr/cinemas/cinema-pathe-wilson',
    'P0645': 'https://www.pathe.fr/cinemas/cinema-pathe-labege'
};
const NOTTE_SUPPORTED_CINEMA_CODES = new Set(Object.keys(PATHE_CINEMA_URLS));
async function fetchJson(url) {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        throw new Error("La variable d'environnement TMDB_API_KEY est manquante. Vérifiez votre fichier .env.local.");
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
    return await response.json();
}
async function getMovies(type, cinemaCode) {
    // On récupère 2 pages de TMDb pour avoir du choix (40 films locaux/globaux)
    const url1 = `${TMDB_BASE_URL}/movie/${type}?language=fr-FR&region=FR&page=1`;
    const url2 = `${TMDB_BASE_URL}/movie/${type}?language=fr-FR&region=FR&page=2`;
    const [list1, list2] = await Promise.all([
        fetchJson(url1),
        fetchJson(url2).catch(()=>({
                results: []
            }))
    ]);
    let allMovies = [
        ...list1.results,
        ...list2.results
    ].filter((movie)=>!movie.adult);
    // Rendre la liste de films unique à chaque cinéma grâce à un seed basé sur son code.
    if (cinemaCode) {
        const hash = Array.from(cinemaCode).reduce((acc, char)=>acc + char.charCodeAt(0), 0);
        allMovies = allMovies.sort((a, b)=>{
            const aHash = (a.id + hash) % 40;
            const bHash = (b.id + hash) % 40;
            return aHash - bHash;
        });
    }
    const topMovies = allMovies.slice(0, 10);
    const detailedMovies = await Promise.all(topMovies.map(async (movie)=>{
        const detailsUrl = `${TMDB_BASE_URL}/movie/${movie.id}?language=fr-FR&append_to_response=videos,credits`;
        // On wrap l'appel détails pour ne pas tout crasher si 1 film pose problème
        const details = await fetchJson(detailsUrl).catch(()=>({}));
        const trailer = details.videos?.results?.find((video)=>video.site === 'YouTube' && video.type === 'Trailer' && video.official) ?? details.videos?.results?.find((video)=>video.site === 'YouTube' && video.type === 'Trailer') ?? null;
        const cast = details.credits?.cast?.slice(0, 8).map((member)=>({
                id: member.id,
                name: member.name,
                character: member.character,
                profileUrl: member.profile_path ? `${TMDB_IMAGE_BASE_URL}${member.profile_path}` : null
            })) ?? [];
        const genres = details.genres?.map((genre)=>genre.name).filter(Boolean) ?? [];
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
        };
    }));
    return detailedMovies;
}
async function searchTmdbMetadata(title) {
    try {
        const searchUrl = `${TMDB_BASE_URL}/search/movie?language=fr-FR&query=${encodeURIComponent(title)}&page=1`;
        const searchResult = await fetchJson(searchUrl);
        if (searchResult.results && searchResult.results.length > 0) {
            const bestMatch = searchResult.results[0];
            return {
                id: bestMatch.id,
                title: bestMatch.title,
                overview: bestMatch.overview,
                posterUrl: bestMatch.poster_path ? `${TMDB_IMAGE_BASE_URL}${bestMatch.poster_path}` : null,
                backdropUrl: bestMatch.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${bestMatch.backdrop_path}` : null,
                releaseDate: bestMatch.release_date,
                voteAverage: bestMatch.vote_average
            };
        }
    } catch (error) {
        console.error(`Error searching TMDb for ${title}:`, error);
    }
    return null;
}
async function getNotteMovieDetails(notteApiKey, notteFunctionId, movieSlug) {
    try {
        const response = await fetch(`https://api.notte.cc/functions/${notteFunctionId}/runs/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${notteApiKey}`,
                'X-Notte-Api-Key': notteApiKey,
                'X-Function-Id': notteFunctionId,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                function_id: notteFunctionId,
                variables: {
                    action: "show",
                    slug: movieSlug
                }
            })
        });
        if (response.ok) {
            const data = await response.json();
            const res = data.result;
            if (res) {
                return {
                    overview: res.synopsis || "",
                    posterUrl: res.posterPath?.md || res.posterPath?.lg || null,
                    backdropUrl: res.backgroundPath?.lg || null,
                    genres: res.genres?.map((g)=>g.name || g) || [],
                    director: res.directors,
                    ageRating: res.contentRating?.label
                };
            }
        }
    } catch (error) {
        console.error(`Error fetching Notte details for ${movieSlug}:`, error);
    }
    return null;
}
async function getStreamingMovies(platform, sort) {
    const providerId = WATCH_PROVIDER_IDS[platform];
    const sortBy = SORT_MAP[sort];
    const url = `${TMDB_BASE_URL}/discover/movie?language=fr-FR&region=FR&watch_region=FR&with_watch_providers=${providerId}&sort_by=${sortBy}&page=1&vote_count.gte=30&with_watch_monetization_types=flatrate`;
    const list = await fetchJson(url);
    const top = list.results.filter((m)=>!m.adult).slice(0, 12);
    const detailedMovies = await Promise.all(top.map(async (movie)=>{
        const detailsUrl = `${TMDB_BASE_URL}/movie/${movie.id}?language=fr-FR&append_to_response=videos,credits`;
        const details = await fetchJson(detailsUrl);
        const trailer = details.videos?.results.find((v)=>v.site === 'YouTube' && v.type === 'Trailer' && v.official) ?? details.videos?.results.find((v)=>v.site === 'YouTube' && v.type === 'Trailer') ?? null;
        const cast = details.credits?.cast.slice(0, 8).map((m)=>({
                id: m.id,
                name: m.name,
                character: m.character,
                profileUrl: m.profile_path ? `${TMDB_IMAGE_BASE_URL}${m.profile_path}` : null
            })) ?? [];
        const genres = details.genres?.map((g)=>g.name).filter(Boolean) ?? [];
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
            platform
        };
    }));
    return detailedMovies;
}
async function getMoviesFromNotte(cinemaCode) {
    if (!NOTTE_SUPPORTED_CINEMA_CODES.has(cinemaCode)) {
        return [];
    }
    const notteApiKey = process.env.NOTTE_API_KEY;
    const notteFunctionId = process.env.NOTTE_FUNCTION_ID;
    if (!notteApiKey || !notteFunctionId) {
        console.warn("NOTTE_API_KEY or NOTTE_FUNCTION_ID is missing. Falling back to TMDb.");
        return [];
    }
    // Mapper le code cinéma vers le slug pour Notte
    // On extrait le slug de l'URL si possible
    const cinemaUrl = PATHE_CINEMA_URLS[cinemaCode] || 'https://www.pathe.fr/cinemas/cinema-pathe-wilson';
    const cinemaSlug = cinemaUrl.split('/').pop() || 'cinema-pathe-wilson';
    try {
        const response = await fetch(`https://api.notte.cc/functions/${notteFunctionId}/runs/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${notteApiKey}`,
                'X-Notte-Api-Key': notteApiKey,
                'X-Function-Id': notteFunctionId,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                function_id: notteFunctionId,
                variables: {
                    action: "cinema_shows",
                    slug: cinemaSlug
                }
            }),
            cache: 'no-store'
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error calling Notte API: ${errorText}`);
            return [];
        }
        const data = await response.json();
        // La structure de retour est { days, shows }
        // shows est un objet où chaque clé est un slug de film
        const showsObj = data.result?.shows || {};
        const movieSlugs = Object.keys(showsObj);
        if (movieSlugs.length === 0) {
            console.warn("No movies found in Notte API response for cinema:", cinemaSlug);
            return [];
        }
        // Mapper les slugs vers des objets Movie
        const movies = await Promise.all(movieSlugs.map(async (slug, index)=>{
            const showData = showsObj[slug];
            // Formatter le titre à partir du slug (ex: "gladiator-ii-456" -> "Gladiator Ii")
            let titleBase = slug.split('-').slice(0, -1).join(' ');
            if (!titleBase) titleBase = slug;
            const title = titleBase.charAt(0).toUpperCase() + titleBase.slice(1);
            // Extraire les séances pour le premier jour disponible
            const firstDay = Object.keys(showData.days || {})[0];
            const dayData = firstDay ? showData.days[firstDay] : {};
            const baseMovie = {
                id: index + 1000000,
                title: title,
                overview: "Chargement des détails...",
                releaseDate: firstDay || new Date().toISOString().split('T')[0],
                posterUrl: null,
                backdropUrl: null,
                runtime: null,
                cast: [],
                trailerYoutubeKey: null,
                voteAverage: null,
                genres: [],
                originalLanguage: dayData.versions?.[0] || 'fr',
                platform: 'pathe',
                cinemaUrl: `${cinemaUrl}/selection/${slug}`,
                showtimes: []
            };
            // Tenter d'enrichir immédiatement si c'est un film spécial
            // On fera le gros du matching dans le GET mais on peut déjà tenter de chercher
            // si on est sûr que c'est un titre bizarre
            return baseMovie;
        }));
        return movies;
    } catch (error) {
        console.error("Error in getMoviesFromNotte:", error);
        return [];
    }
}
async function GET(request) {
    const { searchParams } = new URL(request.url);
    const platformParam = searchParams.get('platform');
    const platform = platformParam && [
        'pathe',
        'netflix',
        'prime',
        'disney'
    ].includes(platformParam) ? platformParam : 'pathe';
    const typeParam = searchParams.get('type');
    const type = typeParam === 'upcoming' ? 'upcoming' : 'now_playing';
    const cinemaCode = searchParams.get('cinema');
    const sortParam = searchParams.get('sort');
    const sort = sortParam && [
        'release_desc',
        'release_asc',
        'popularity',
        'vote_desc'
    ].includes(sortParam) ? sortParam : 'release_desc';
    try {
        let movies = [];
        if (platform === 'pathe') {
            // 1. Récupérer les films de TMDb pour avoir les métadonnées riches (titres, posters, etc.)
            const tmdbMovies = await getMovies(type, cinemaCode);
            // 2. Notte uniquement pour les cinémas réellement supportés
            if (cinemaCode && NOTTE_SUPPORTED_CINEMA_CODES.has(cinemaCode)) {
                const notteMovies = await getMoviesFromNotte(cinemaCode);
                if (notteMovies.length > 0) {
                    // 3. Fusionner : On garde l'ordre de Notte (le plus "accuré")
                    // mais on récupère les infos de TMDb quand ça match.
                    movies = await Promise.all(notteMovies.map(async (notteMovie)=>{
                        // Tentative de matching par titre ou slug
                        const normalizedNotte = notteMovie.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const matchingTmdb = tmdbMovies.find((tmdb)=>{
                            const normalizedTmdb = tmdb.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                            return normalizedNotte.includes(normalizedTmdb) || normalizedTmdb.includes(normalizedNotte);
                        });
                        if (matchingTmdb) {
                            return {
                                ...matchingTmdb,
                                id: matchingTmdb.id,
                                cinemaUrl: notteMovie.cinemaUrl,
                                originalLanguage: notteMovie.originalLanguage || matchingTmdb.originalLanguage
                            };
                        }
                        // Fallback léger: on conserve l'entrée Notte sans lancer de recherche lourde
                        return notteMovie;
                    }));
                } else {
                    // Fallback total sur TMDb si Notte ne renvoie rien
                    movies = tmdbMovies;
                }
            } else {
                // Tous les autres cinémas (UGC/ABC/mock/etc.) reposent sur TMDb uniquement
                movies = tmdbMovies;
            }
        } else {
            movies = await getStreamingMovies(platform, sort);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            movies
        });
    } catch (error) {
        console.error(error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: "Impossible de récupérer les films pour le moment. Merci de réessayer plus tard."
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__56f9e8a3._.js.map