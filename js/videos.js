export const embedUrl = (id) => `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0`;
export const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;

// A video counts as watched when you said so; otherwise the status in the video index decides.
export const isWatched = (state, video) => (video.id in state.watched ? state.watched[video.id] : video.status === 'Watched');

export function videoOf(data, id) {
  return data.videos.find((v) => v.id === id) ?? { n: 0, id, title: data.titles[id] ?? 'Video', source: '', duration: '', layer: '', chapters: [], status: 'Next' };
}
