// eslint-disable-next-line react/prop-types
function GeralProgressBar({ geralPercentage }) {
  return (
    <div className="flex flex-col neuphormism-b-se p-5 my-5 mr-5">
      <div className="flex flex-row justify-between">
        <h1 className="text-xl font-bold">Progress Bar</h1>
        <h1 className="text-2xl font-bold">{geralPercentage}%</h1>
      </div>
      <div className="relative pt-1 mt-6 w-full">
        <div className="overflow-hidden h-1 mb-4 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: `${80}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
          ></div>
        </div>
      </div>
    </div>
  );
}

export default GeralProgressBar;
