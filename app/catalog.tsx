"use client";

import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Clock3,
  Film,
  Search,
  Star,
  X,
} from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState } from "react";

interface Movie {
  _id: string;
  title?: string;
  year?: number | string;
  genres?: string[];
  runtime?: number;
  plot?: string;
  poster?: string;
  imdb?: { rating?: number };
  cast?: string[];
  directors?: string[];
}

interface MovieResponse {
  items: Movie[];
  total: number;
  collectionTotal: number;
  page: number;
  pages: number;
  genres: string[];
  error?: string;
}

function displayYear(year?: number | string) {
  const match = String(year ?? "").match(/\d{4}/);
  return match?.[0] ?? "Year unknown";
}

function formatCount(count: number) {
  return new Intl.NumberFormat("en-US").format(count);
}

function Poster({ movie, large = false, onUnavailable }: { movie: Movie; large?: boolean; onUnavailable?: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`poster ${large ? "poster-large" : ""}`}>
      {movie.poster && /^https?:\/\//.test(movie.poster) && !failed ? (
        <Image
          src={movie.poster}
          alt={`${movie.title ?? "Movie"} poster`}
          fill
          unoptimized
          onError={() => { setFailed(true); onUnavailable?.(); }}
          sizes={large ? "(max-width: 700px) 80vw, 320px" : "(max-width: 680px) 44vw, (max-width: 1050px) 27vw, 21vw"}
        />
      ) : (
        <div className="poster-placeholder" aria-label="Poster unavailable">
          <Film size={32} strokeWidth={1.3} />
          <span>NO IMAGE</span>
        </div>
      )}
      <span className="poster-index">FRAME / {displayYear(movie.year)}</span>
    </div>
  );
}

export default function Catalog() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [genre, setGenre] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MovieResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<Movie | null>(null);
  const [unavailablePosters, setUnavailablePosters] = useState<Set<string>>(new Set());
  const visibleMovies = data?.items.filter((movie) => movie.poster && !unavailablePosters.has(movie._id)) ?? [];
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: "24" });
    if (deferredSearch.trim()) params.set("search", deferredSearch.trim());
    if (genre) params.set("genre", genre);

    fetch(`/api/movies?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as MovieResponse;
        if (!response.ok) throw new Error(result.error ?? "The archive could not be loaded.");
        if (controller.signal.aborted) return;
        setError("");
        setData(result);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "The archive could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [deferredSearch, genre, page, retry]);

  useEffect(() => {
    if (!selected) return;
    dialogRef.current?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [selected]);

  function updateSearch(value: string) {
    if (value === search && page === 1) return;
    setLoading(true);
    setError("");
    setSearch(value);
    setPage(1);
  }

  function updateGenre(value: string) {
    if (value === genre && page === 1) return;
    setLoading(true);
    setError("");
    setGenre(value);
    setPage(1);
  }

  function changePage(nextPage: number) {
    setLoading(true);
    setError("");
    setPage(nextPage);
  }

  function retryRequest() {
    setLoading(true);
    setError("");
    setRetry((value) => value + 1);
  }

  return (
    <main className="archive-shell">
      <header className="masthead">
        <a className="brand" href="#top" aria-label="Frame archive home">
          <span className="brand-mark"><Clapperboard size={19} strokeWidth={1.8} /></span>
          <span>FRAME<span className="brand-period">.</span></span>
        </a>
        <div className="masthead-center"><span className="live-dot" /> THE MOVING PICTURE INDEX</div>
        <a className="masthead-link" href="#collection">EXPLORE ARCHIVE <span>↘</span></a>
      </header>

      <section className="intro" id="top">
        <div className="intro-copy">
          <p className="eyebrow"><span>01</span> / THE M-FLIX COLLECTION</p>
          <h1>The movie<br /><em>archive.</em></h1>
          <p className="intro-note">A living index of stories, performances, and the people behind them.</p>
        </div>
        <div className="intro-aside" aria-label="Collection size">
          <span className="aside-rule" />
          <span className="aside-label">IN THE COLLECTION</span>
          <strong>{data ? formatCount(data.collectionTotal) : "—"}</strong>
          <span className="aside-caption">films &amp; series<br />one frame at a time</span>
          <Clapperboard className="aside-icon" size={42} strokeWidth={1} />
        </div>
      </section>

      <section className="collection" id="collection" aria-labelledby="collection-title">
        <div className="collection-heading">
          <div>
            <p className="eyebrow"><span>02</span> / BROWSE THE INDEX</p>
            <h2 id="collection-title">Find your next <em>watch.</em></h2>
          </div>
          <span className="collection-count">ARCHIVE NO. <strong>001—∞</strong></span>
        </div>

        <div className="filter-bar">
          <label className="search-field">
            <Search size={18} strokeWidth={1.8} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search titles, people, plots"
              aria-label="Search titles, cast, and plots"
            />
            <kbd>⌕</kbd>
          </label>
          <label className="genre-select-wrap">
            <span className="select-label">GENRE</span>
            <select value={genre} onChange={(event) => updateGenre(event.target.value)} aria-label="Filter by genre">
              <option value="">All genres</option>
              {(data?.genres ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <ChevronRight className="select-chevron" size={15} />
          </label>
        </div>

        <div className="results-line" aria-live="polite">
          <span>{loading ? "SCANNING THE ARCHIVE" : `${formatCount(data?.total ?? 0)} TITLES`}</span>
          <span className="results-divider" />
          <span>{genre || "ALL GENRES"}{deferredSearch ? ` / “${deferredSearch}”` : " / LATEST ADDITIONS"}</span>
          <span className="results-page">PAGE {String(page).padStart(2, "0")} <span>/</span> {String(data?.pages ?? 1).padStart(2, "0")}</span>
        </div>

        {error ? (
          <div className="notice" role="alert">
            <p>{error}</p>
            <button className="text-button" onClick={retryRequest}>Try again <span>↗</span></button>
          </div>
        ) : loading && !data ? (
          <div className="movie-grid" aria-label="Loading movie titles">
            {Array.from({ length: 12 }, (_, index) => <div className="movie-skeleton" key={index} />)}
          </div>
        ) : visibleMovies.length ? (
          <div className={`movie-grid ${loading ? "grid-refreshing" : ""}`}>
            {visibleMovies.map((movie, index) => (
              <button className="movie-card" key={movie._id} onClick={() => setSelected(movie)}>
                <Poster movie={movie} onUnavailable={() => setUnavailablePosters((previous) => new Set(previous).add(movie._id))} />
                <span className="movie-meta-line">
                  <span>{displayYear(movie.year)}</span>
                  {typeof movie.imdb?.rating === "number" ? <span className="rating"><Star size={11} fill="currentColor" /> {movie.imdb.rating.toFixed(1)}</span> : <span>—</span>}
                </span>
                <span className="movie-title">{movie.title || "Untitled"}</span>
                <span className="movie-genre">{movie.genres?.slice(0, 2).join(" · ") || "UNCATEGORIZED"}</span>
                <span className="card-number">{String((page - 1) * 24 + index + 1).padStart(4, "0")}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Film size={28} strokeWidth={1.2} />
            <p>{data?.items.length ? "No posters available on this page. Try the next page." : "No titles found in this frame."}</p>
            <button className="text-button" onClick={() => { updateSearch(""); updateGenre(""); }}>Clear filters <span>↗</span></button>
          </div>
        )}

        <nav className="pagination" aria-label="Movie pages">
          <span>{data?.total ? `SHOWING ${formatCount((page - 1) * 24 + 1)}–${formatCount(Math.min(page * 24, data.total))} OF ${formatCount(data.total)}` : " "}</span>
          <div className="pagination-controls">
            <button aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => changePage(Math.max(1, page - 1))}>
              <ChevronLeft size={18} />
            </button>
            <span>{String(page).padStart(2, "0")} <i>/</i> {String(data?.pages ?? 1).padStart(2, "0")}</span>
            <button aria-label="Next page" disabled={!data || page >= data.pages || loading} onClick={() => changePage(page + 1)}>
              <ChevronRight size={18} />
            </button>
          </div>
        </nav>
      </section>

      <footer className="footer">
        <span><Clapperboard size={14} /> FRAME / SAMPLE M-FLIX</span>
        <span>AN OPEN INDEX FOR THE CINEMA-CURIOUS</span>
        <span>MADE TO BE BROWSED <span className="footer-star">✳</span></span>
      </footer>

      {selected && (
        <dialog ref={dialogRef} className="modal-backdrop" onCancel={() => setSelected(null)} aria-labelledby="dialog-title" onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="movie-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={(event) => event.stopPropagation()}>
            <button className="dialog-close" onClick={() => setSelected(null)} aria-label="Close movie details"><X size={20} /></button>
            <Poster movie={selected} large />
            <div className="dialog-copy">
              <p className="eyebrow"><span>FRAME / {displayYear(selected.year)}</span></p>
              <h2 id="dialog-title">{selected.title || "Untitled"}</h2>
              <div className="dialog-facts">
                {typeof selected.imdb?.rating === "number" && <span className="rating"><Star size={13} fill="currentColor" /> {selected.imdb.rating.toFixed(1)} IMDb</span>}
                {selected.runtime && <span><Clock3 size={13} /> {selected.runtime} min</span>}
                {selected.genres?.map((item) => <span key={item}>{item}</span>)}
              </div>
              <p className="dialog-plot">{selected.plot || "No synopsis is available for this title."}</p>
              {selected.directors?.length ? <p className="dialog-credit"><span>DIRECTED BY</span>{selected.directors.join(", ")}</p> : null}
              {selected.cast?.length ? <p className="dialog-credit"><span>STARRING</span>{selected.cast.slice(0, 5).join(" · ")}</p> : null}
            </div>
          </section>
        </dialog>
      )}
    </main>
  );
}
