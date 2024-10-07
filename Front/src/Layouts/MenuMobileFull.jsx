/* eslint-disable react/prop-types */
function MenuMobileFull({ setMobileMenuOpen }) {
  return (
    <>
      <div className="neuphormism-b p-5 w-screen h-screen">
        <div className="flex flex-col">
          <div className="flex flex-row justify-between">
            <div className="flex flex-row gap-2">
              <div className="p-3 neuphormism-b-btn">
                <h1>Menu</h1>
              </div>
              <div className="p-3 neuphormism-b-btn">
                <h1>User</h1>
              </div>
            </div>
            <button
              className=" px-4 mx-2 neuphormism-b-btn "
              onClick={() => setMobileMenuOpen(false)}
            >
              X
            </button>
          </div>
          <div className="flex flex-row justify-between py-4">
            <div className="px-3 py-24 neuphormism-b-btn flex-1 h-1/2 mr-2 text-center">
              Dashboard
            </div>
            <div className="px-3 py-24  neuphormism-b-btn flex-1 h-1/2 mx-2 text-center">
              Chord Library
            </div>
            <div className="px-3 py-24  neuphormism-b-btn flex-1 h-1/2 mx-2 text-center">
              Tuner
            </div>
            <div className="px-3 py-24  neuphormism-b-btn flex-1 h-1/2 ml-2 text-center">
              Metronome
            </div>
          </div>
        </div>
      </div>
      342
    </>
  );
}

export default MenuMobileFull;
