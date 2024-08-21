/* eslint-disable react/prop-types */
// eslint-disable-next-line react/prop-types
function NewSongEmbed({ ytEmbedSongList }) {
  return (
    <>
      <div className="flex flex-col neuphormism-b p-5 my-5 mr-5">
        <h1 className="text-xl pb-2 font-bold">Embed</h1>
        <input
          type="text"
          name="ytlink"
          placeholder="Insert your link here"
          className="w-full p-1 border border-gray-300 rounded-md text-sm"
          //   value={embedLink}
        />
        <div className="flex flex-row neuphormism-b-btn px-5 py-2 my-2 m-0 justify-between">
          <ul className="flex flex-col">
            {ytEmbedSongList.map((ytLink, index) => {
              return (
                <li key={index} className="text-[6pt] py-2">
                  {ytLink}
                </li>
              );
            })}
          </ul>
          <ul className="flex flex-col">
            {ytEmbedSongList.map((ytLink, index) => {
              return (
                <li key={index} className="text-[6pt] py-2 hover:font-black">
                  <a href="#">PLAY</a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}

export default NewSongEmbed;
