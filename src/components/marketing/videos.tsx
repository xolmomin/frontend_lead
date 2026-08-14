"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";

/** "Video darsliklar" — production `videos` section (id=videos). */

const PLAYLIST = "PLpOJZjIJkS1_4d2-s6FDR516cURUsbgfL";

const VIDEOS = [
  {
    id: "uMKnfmkvR00",
    thumbnail: "https://i.ytimg.com/vi/uMKnfmkvR00/maxresdefault.jpg",
  },
  {
    id: "z_xKJoYb6Vg",
    thumbnail: "https://i.ytimg.com/vi/z_xKJoYb6Vg/maxresdefault.jpg",
  },
  {
    id: "9uXWfRI2bgU",
    thumbnail: "https://i.ytimg.com/vi/9uXWfRI2bgU/maxresdefault.jpg",
  },
];

interface VideoItem {
  title: string;
  description: string;
}

function VideoCard({
  video,
  item,
}: {
  video: (typeof VIDEOS)[number];
  item?: VideoItem;
}) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="card-elevated overflow-hidden rounded-2xl">
      <div className="relative overflow-hidden aspect-video">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&list=${PLAYLIST}`}
            title={item?.title ?? ""}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="w-full h-full cursor-pointer group"
            aria-label={item?.title ?? "Play video"}
          >
            <Image
              src={video.thumbnail}
              alt={item?.title ?? ""}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full gradient-primary-diagonal flex items-center justify-center shadow-glow-md group-hover:scale-110 transition-transform duration-300">
                <Play
                  className="w-6 h-6 sm:w-7 sm:h-7 text-white ml-1"
                  fill="white"
                  aria-hidden="true"
                />
              </div>
            </div>
          </button>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {item?.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {item?.description}
        </p>
      </div>
    </div>
  );
}

export function Videos() {
  const t = useTranslations("landing");
  const raw = t.raw("videos.items");
  const items: VideoItem[] = Array.isArray(raw) ? raw : [];

  return (
    <section id="videos" className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
            {t("videos.title")}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("videos.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VIDEOS.map((video, index) => (
            <VideoCard key={video.id} video={video} item={items[index]} />
          ))}
        </div>
      </div>
    </section>
  );
}
