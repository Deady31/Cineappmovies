'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Clock, Star, X, Info } from 'lucide-react';
import type { Movie } from '@/app/api/movies/route';

interface MovieCardProps {
  movie: Movie;
  cinema?: { name: string; code: string };
}

interface RecommendedMovie {
  id: number;
  title: string;
  posterUrl: string | null;
  releaseDate: string;
  voteAverage: number | null;
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

function formatRuntime(runtime: number | null) {
  if (!runtime || runtime <= 0) return 'Durée inconnue';
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  if (!hours) return `${minutes} min`;
  return `${hours} h ${minutes.toString().padStart(2, '0')} min`;
}

export function MovieCard({ movie, cinema }: MovieCardProps) {
  const [open, setOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedMovie[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingRecs(true);
      fetch(`/api/movies/${movie.id}/recommendations`)
        .then(res => res.json())
        .then(data => setRecommendations(data.recommendations || []))
        .catch(console.error)
        .finally(() => setLoadingRecs(false));
    }
  }, [open, movie.id]);

  const shortOverview =
    movie.overview.length > 160
      ? `${movie.overview.slice(0, 157)}...`
      : movie.overview || 'Pas de synopsis disponible.';

  return (
    <>
      <article className="glass-panel group flex h-full -skew-x-3 flex-col overflow-hidden border-white/20 bg-black/80">
        <div
          className="relative aspect-[2.1/3] w-full cursor-pointer overflow-hidden border-b border-white/10"
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          {movie.posterUrl ? (
            <>
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                priority={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.4),transparent_45%),radial-gradient(circle_at_100%_100%,rgba(255,0,47,0.9),transparent_55%)] opacity-80 mix-blend-screen transition-opacity group-hover:opacity-100" />
              {movie.voteAverage && (
                <div className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black px-2 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-[3px_3px_0_#ffea00]">
                  <Star className="h-3 w-3 text-primary-400" />
                  <span>{movie.voteAverage.toFixed(1)}</span>
                  <span className="text-[9px] text-slate-300">TMDb</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-200 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Affiche indisponible
            </div>
          )}
          <div className="absolute left-2 top-2 rounded-[999px] bg-black px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-[3px_3px_0_#ffea00]">
            {formatDate(movie.releaseDate)}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="space-y-1">
            <h3 className="line-clamp-2 text-base font-extrabold leading-tight text-white">
              {movie.title}
            </h3>
            <p className="line-clamp-3 text-xs text-slate-200/80">
              {shortOverview}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-200/80">
              <Clock className="h-3.5 w-3.5 text-primary-400" />
              <span>{formatRuntime(movie.runtime)}</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center rounded-full bg-primary-500 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-black shadow-[3px_3px_0_#ffffff] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#ffffff]"
            >
              Détails
            </button>
          </div>
        </div>
      </article>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/80 text-slate-100 shadow-lg shadow-black/70 hover:bg-black"
              aria-label="Fermer les détails du film"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <div className="space-y-4">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
                  {movie.posterUrl ? (
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 60vw, 30vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-800 text-sm text-slate-400">
                      Affiche indisponible
                    </div>
                  )}
                </div>

                {movie.trailerYoutubeKey && (
                  <div className="space-y-3 rounded-2xl bg-slate-800/50 p-4 border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-slate-200">Bande-annonce</h4>
                    <div className="aspect-video overflow-hidden rounded-xl border border-slate-700 bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${movie.trailerYoutubeKey}`}
                        title={`Bande-annonce de ${movie.title}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <header className="space-y-3 border-b border-slate-700/50 pb-4">
                  <p className="flex items-center justify-between text-sm font-bold uppercase tracking-widest text-primary-400">
                    <span>{cinema?.name || 'Cinéma Pathé Wilson'}</span>
                    {movie.cinemaUrl && (
                      <a
                        href={movie.cinemaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-slate-400 underline decoration-slate-600 hover:text-white"
                      >
                        Visiter le site du cinéma
                      </a>
                    )}
                  </p>
                  <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                    {movie.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                    <span>{formatDate(movie.releaseDate)}</span>
                    <span>•</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                    {movie.ageRating && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-red-500">{movie.ageRating}</span>
                      </>
                    )}
                    {movie.voteAverage && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                          <span>{movie.voteAverage.toFixed(1)}</span>
                          <span className="text-[10px] text-emerald-300/90">
                            TMDb
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                  {movie.director && (
                    <p className="text-sm text-slate-400">
                      Un film de <span className="font-bold text-slate-200">{movie.director}</span>
                    </p>
                  )}
                </header>

                <section className="space-y-2 text-sm">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2"><Info className="h-4 w-4 text-primary-400" /> Synopsis</h3>
                  <p className="leading-relaxed text-slate-300">
                    {movie.overview || 'Pas de synopsis disponible.'}
                  </p>
                </section>

                {movie.genres.length > 0 && (
                  <section className="space-y-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {movie.genres.map((genre) => (
                        <span
                          key={genre}
                          className="rounded-full border border-primary-500/30 bg-primary-500/10 px-2 py-0.5 text-xs text-primary-100"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="space-y-4 text-sm rounded-2xl bg-slate-800/40 p-4 border border-slate-700/50">
                  {(movie.platform ?? 'pathe') === 'pathe' ? (
                    <>
                      <h3 className="text-base font-bold text-slate-100 flex items-center justify-between">
                        <span>Séances au {cinema?.name || 'cinéma'}</span>
                        {movie.showtimes && movie.showtimes.length > 0 && (
                          <span className="text-[10px] font-medium bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-500/30">Séances en ligne</span>
                        )}
                      </h3>

                      {movie.showtimes && movie.showtimes.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {movie.showtimes.map((showtime, idx) => (
                            <button
                              key={idx}
                              onClick={() => window.open(showtime.link, '_blank')}
                              disabled={showtime.isSoldOut}
                              className={`group relative flex flex-col items-center justify-center rounded-xl border border-white/20 bg-black/60 px-4 py-2.5 transition hover:border-primary-500 hover:bg-primary-500/10 ${showtime.isSoldOut ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-bold text-white group-hover:text-primary-400">{showtime.time}</span>
                                <div className="mt-0.5 flex gap-1">
                                  {showtime.version && (
                                    <span className="rounded bg-slate-700 px-1 py-0.5 text-[8px] font-black text-slate-200 group-hover:bg-slate-600 uppercase">
                                      {showtime.version}
                                    </span>
                                  )}
                                  {showtime.roomType && (
                                    <span className="rounded bg-primary-500/30 px-1 py-0.5 text-[8px] font-black text-primary-400 border border-primary-500/20 uppercase">
                                      {showtime.roomType}
                                    </span>
                                  )}
                                  {showtime.price && (
                                    <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[8px] font-black text-emerald-400 border border-emerald-500/20">
                                      {showtime.price}
                                    </span>
                                  )}
                                  {showtime.attributes?.map((attr, i) => (
                                    <span key={i} className="rounded bg-slate-800 px-1 py-0.5 text-[8px] font-bold text-slate-400 border border-white/10 uppercase">
                                      {attr}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <span className="mt-1.5 text-[8px] font-black uppercase tracking-widest text-slate-500 group-hover:text-primary-500/70">
                                {showtime.isSoldOut ? 'Complet' : 'Réserver'}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <>
                          <p className="text-slate-400 italic">
                            Les horaires précis pour ce cinéma ne sont pas encore chargés.
                            Consultez les séances sur Allociné :
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const q = encodeURIComponent(movie.title + (cinema ? ' ' + cinema.name : ''));
                              window.open(
                                `https://www.allocine.fr/recherche/?q=${q}`,
                                '_blank',
                                'noopener,noreferrer'
                              );
                            }}
                            className="inline-flex w-full items-center justify-center rounded-xl bg-primary-500 px-4 py-3 text-sm font-bold uppercase tracking-wider text-black shadow-lg shadow-primary-500/20 transition hover:scale-[1.02] hover:bg-primary-400 sm:w-auto"
                          >
                            Voir les séances sur Allociné
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-base font-bold text-slate-100">
                        Regarder sur{' '}
                        {movie.platform === 'netflix'
                          ? 'Netflix'
                          : movie.platform === 'prime'
                            ? 'Prime Video'
                            : 'Disney+'}
                      </h3>
                      <p className="text-slate-400">
                        Ce film est disponible en streaming. Ouvrez la plateforme
                        pour le regarder.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const q = encodeURIComponent(movie.title);
                          const urls: Record<string, string> = {
                            netflix: `https://www.netflix.com/search?q=${q}`,
                            prime: `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}`,
                            disney: `https://www.disneyplus.com/search?q=${q}`
                          };
                          const platform = movie.platform || 'netflix';
                          window.open(
                            urls[platform] ?? urls.netflix,
                            '_blank',
                            'noopener,noreferrer'
                          );
                        }}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-black shadow-lg transition hover:scale-[1.02] hover:bg-slate-200 sm:w-auto"
                      >
                        Ouvrir{' '}
                        {movie.platform === 'netflix'
                          ? 'Netflix'
                          : movie.platform === 'prime'
                            ? 'Prime Video'
                            : 'Disney+'}
                      </button>
                    </>
                  )}
                </section>

                {movie.cast.length > 0 && (
                  <section className="space-y-3 text-sm">
                    <h3 className="text-base font-bold text-slate-100">Casting principal</h3>
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {movie.cast.map((member) => (
                        <li
                          key={member.id}
                          className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-2 text-xs border border-slate-700/50 hover:bg-slate-800 transition"
                        >
                          {member.profileUrl && (
                            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-700">
                              <Image
                                src={member.profileUrl}
                                alt={member.name}
                                fill
                                className="object-cover"
                                sizes="36px"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-200">{member.name}</p>
                            {member.character && (
                              <p className="text-slate-400">
                                {member.character}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Section Recommandations */}
                <section className="space-y-3 text-sm pt-4 border-t border-slate-700/50">
                  <h3 className="text-base font-bold text-slate-100">Films similaires</h3>
                  {loadingRecs ? (
                    <div className="flex h-24 items-center justify-center">
                      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></span>
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {recommendations.slice(0, 4).map((rec) => (
                        <div key={rec.id} className="group cursor-pointer space-y-2" onClick={() => {
                          // Optionnellement : router.push(`/movie/${rec.id}`) ou rafraichir la modale.
                          // Pour la simplicité ici on affiche juste.
                        }}>
                          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-800">
                            {rec.posterUrl && (
                              <Image src={rec.posterUrl} alt={rec.title} fill className="object-cover transition group-hover:scale-105" sizes="120px" />
                            )}
                          </div>
                          <p className="line-clamp-2 text-[11px] font-semibold text-slate-300 group-hover:text-primary-400">{rec.title}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400">Aucune recommandation trouvée.</p>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

