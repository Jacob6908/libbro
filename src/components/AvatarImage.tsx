import "./AvatarImage.css";

export default function AvatarImage({
  url,
  size = 64,
}: {
  url: string | null;
  size?: number;
}) {
  if (url) {
    return (
      <div className="avatar-bookplate" style={{ width: size, height: size }}>
        <img src={url} alt="" className="avatar-bookplate-fill object-cover" />
      </div>
    );
  }

  return (
    <div className="avatar-bookplate" style={{ width: size, height: size }}>
      <div className="avatar-bookplate-fill flex items-center justify-center bg-ink/10">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-ink/40"
          style={{ width: size * 0.6, height: size * 0.6 }}
        >
          <path d="M12 12c2.71 0 4.9-2.19 4.9-4.9S14.71 2.2 12 2.2 7.1 4.39 7.1 7.1 9.29 12 12 12zm0 2.45c-3.27 0-9.8 1.64-9.8 4.9v2.45h19.6v-2.45c0-3.26-6.53-4.9-9.8-4.9z" />
        </svg>
      </div>
    </div>
  );
}
