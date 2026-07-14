/**
 * Stand-ins for the photo collage on the landing page: each tile previews a real
 * contribution type. Swap any of these for an <Image /> once photography exists.
 */

export function TranslationTile() {
  return (
    <div className="flex h-full flex-col justify-between bg-night p-7 text-white">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-sun">
        Translation pair
      </span>
      <div>
        <p className="text-3xl font-extrabold leading-tight">Dumela mma</p>
        <div className="my-4 h-px w-10 bg-white/25" />
        <p className="text-lg text-white/70">Good morning, ma&apos;am</p>
      </div>
      <p className="text-xs font-medium text-white/45">
        Setswana &middot; Kweneng &middot; approved
      </p>
    </div>
  );
}

export function AudioTile() {
  const bars = [14, 30, 22, 46, 62, 38, 70, 52, 34, 58, 44, 26, 48, 66, 30, 18, 40, 24];
  return (
    <div className="flex h-full flex-col justify-between bg-white p-6">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-clay">
        Voice recording
      </span>
      <div className="flex h-20 items-center gap-1.5" aria-hidden="true">
        {bars.map((height, index) => (
          <span
            key={index}
            style={{ height: `${height}%` }}
            className="w-1.5 flex-1 rounded-full bg-leaf/70"
          />
        ))}
      </div>
      <p className="text-xs font-medium text-stone">
        0:12 &middot; pronunciation &middot; consent on file
      </p>
    </div>
  );
}

export function LabelTile() {
  const labels = ["kgotla", "morula", "letsopa", "dikgomo"];
  return (
    <div className="flex h-full flex-col justify-between bg-cream p-6">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-clay">
        Image labels
      </span>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <span
            key={label}
            className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-night ring-1 ring-night/10"
          >
            {label}
          </span>
        ))}
      </div>
      <p className="text-xs font-medium text-stone">4 labels &middot; 1 bounding box</p>
    </div>
  );
}
