import PropTypes from "prop-types";

function InformationChannel({ visible }) {
  if (!visible) return null;

  return (
    <div className="w-full shrink-0 bg-[goldenrod] px-4 py-2 text-center text-sm font-black uppercase tracking-[0.14em] text-black shadow-[0_2px_8px_rgba(0,0,0,0.16)]">
      Editor is on
    </div>
  );
}

InformationChannel.propTypes = {
  visible: PropTypes.bool,
};

export default InformationChannel;
