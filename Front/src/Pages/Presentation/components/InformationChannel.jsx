import PropTypes from "prop-types";

function InformationChannel({ visible }) {
  if (!visible) return null;

  return (
    <div className="w-full shrink-0 bg-[goldenrod] px-4 py-1 text-center text-[10px] font-black uppercase leading-none tracking-[0.32em] text-black shadow-[0_2px_8px_rgba(0,0,0,0.16)]">
      Editor is on
    </div>
  );
}

InformationChannel.propTypes = {
  visible: PropTypes.bool,
};

export default InformationChannel;
