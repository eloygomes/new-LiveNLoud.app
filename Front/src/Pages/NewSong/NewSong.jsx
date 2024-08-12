import NewSongColumnA from "./NewSongColumnA";
import NewSongColumnB from "./NewSongColumnB";

function NewSong() {
  return (
    <div className=" flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        <div className="h-screen w-11/12 2xl:w-9/12 mx-auto ">
          <div className="flex flex-row my-5 neuphormism-b p-5">
            <h1 className="text-4xl font-bold">Add new song</h1>
            <h4 className="ml-auto mt-auto text-sm">Register new song here</h4>
          </div>
          <div className="flex flex-row">
            <div className="left-column w-1/2">
              <NewSongColumnA />
            </div>
            <div className="right-column w-1/2">
              <NewSongColumnB />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewSong;
