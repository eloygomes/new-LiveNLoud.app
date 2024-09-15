/* eslint-disable react/prop-types */
export default function UserProfileAvatar({ src, size, alt = "User Avatar" }) {
  return (
    <>
      {/* //MOBILE */}
      {window.innerWidth <= 926 && window.innerWidth > 426 && (
        <div className="flex items-center space-x-2 my-1 relative right-3">
          <img
            className={`w-${size} h-${size} object-cover neuphormism-b-avatar`}
            alt={alt}
            src={src}
          />
        </div>
      )}
      {/* //DESKTOP */}
      {window.innerWidth >= 926 && (
        <div className="flex items-center space-x-2 my-5 relative right-3">
          <img
            className={`w-${size} h-${size} object-cover neuphormism-b-avatar`}
            alt={alt}
            src={src}
          />
        </div>
      )}
    </>
  );
}
