import PropTypes from "prop-types";

function InformationChannel({ visible }) {
  if (!visible) return null;

  return (
    <div className="relative z-[121] w-full shrink-0 bg-[goldenrod] px-4 py-1 text-center text-[10px] font-bold uppercase leading-none tracking-[0.32em] text-black">
      Editor is on
    </div>
  );
}

InformationChannel.propTypes = {
  visible: PropTypes.bool,
};

export default InformationChannel;
