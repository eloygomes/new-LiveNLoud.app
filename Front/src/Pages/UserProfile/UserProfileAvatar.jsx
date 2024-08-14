/* eslint-disable react/prop-types */
export default function UserProfileAvatar({ src, size, alt = "User Avatar" }) {
  return (
    <div className="flex items-center space-x-2 my-5">
      <img
        className={`w-${size} h-${size} object-cover neuphormism-b-avatar`}
        alt={alt}
        src={src}
      />
    </div>
  );
}
