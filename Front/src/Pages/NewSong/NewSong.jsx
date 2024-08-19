import { useState } from "react";

import NewSongColumnA from "./NewSongColumnA";
import NewSongColumnB from "./NewSongColumnB";

function NewSong() {
  // Column B
  // Guitar 01
  const [guitar01, setGuitar01] = useState("");
  const [progBarG01, setProgBarG01] = useState(0);

  // Guitar 02
  const [guitar02, setGuitar02] = useState("");
  const [progBarG02, setProgBarG02] = useState(0);

  // Bass
  const [bass, setBass] = useState("");
  const [progBarBass, setProgBarBass] = useState(0);

  // Key
  const [key, setKey] = useState("");
  const [progBarKey, setProgBarKey] = useState(0);

  // Drums
  const [drums, setDrums] = useState("");
  const [progBarDrums, setProgBarDrums] = useState(0);

  // Voice
  const [voice, setVoice] = useState("");
  const [progBarVoice, setProgBarVoice] = useState(0);

  // console.log(guitar01, guitar02, bass, key, drums, voice);

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
              <NewSongColumnB
                guitar01={guitar01}
                setGuitar01={setGuitar01}
                guitar02={guitar02}
                setGuitar02={setGuitar02}
                bass={bass}
                setBass={setBass}
                keyboard={key}
                setKey={setKey}
                drums={drums}
                setDrums={setDrums}
                voice={voice}
                setVoice={setVoice}
                progBarG01={progBarG01}
                setProgBarG01={setProgBarG01}
                progBarG02={progBarG02}
                setProgBarG02={setProgBarG02}
                progBarBass={progBarBass}
                setProgBarBass={setProgBarBass}
                progBarKey={progBarKey}
                setProgBarKey={setProgBarKey}
                progBarDrums={progBarDrums}
                setProgBarDrums={setProgBarDrums}
                progBarVoice={progBarVoice}
                setProgBarVoice={setProgBarVoice}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewSong;
