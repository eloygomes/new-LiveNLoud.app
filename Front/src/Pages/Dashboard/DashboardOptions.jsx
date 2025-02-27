/* eslint-disable react/prop-types */

import { RiDeleteBin6Line } from "react-icons/ri";
import { MdAddCircle } from "react-icons/md";
import { IoClose } from "react-icons/io5";

export default function DashboardOptions({ optStatus, setOptStatus }) {
  return (
    <div className="flex flex-col top-[67px] sticky justify-between neuphormism-b  bg-white z-30 h-[300px]">
      <div className="flex flex-row justify-between  py-1 rounded-t-md  bg-black/10">
        <h1 className="px-5 py-3 font-bold text-lg">OPTIONS</h1>
        <div className="px-5 py-3" onClick={() => setOptStatus(false)}>
          <IoClose className="w-6 h-6 cursor-pointer " />
        </div>
      </div>
      <div className="flex flex-row justify-between">
        <div className="w-1/2 flex flex-col  p-5">
          <label className="py-2 text-sm" htmlFor="select">
            Select a setlist:
          </label>
          <div className="flex flex-row justify-between">
            <select
              className="w-[90%] py-3 rounded-lg border-black/20 border-2"
              name="pets"
              id="select"
            >
              <option className="" value="">
                -- Please choose an option --
              </option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="hamster">Hamster</option>
              <option value="parrot">Parrot</option>
              <option value="spider">Spider</option>
              <option value="goldfish">Goldfish</option>
            </select>
            <RiDeleteBin6Line className="w-6 h-6 mt-3" />
          </div>
        </div>
        <div className="w-1/2 flex flex-col justify-between p-5">
          <form className="flex flex-col">
            <label className="py-2 text-sm" htmlFor="newItem">
              Add new setlist:
            </label>
            <div className="flex flex-row justify-between">
              <input
                className="w-[90%] px-2 py-2.5 rounded-lg  border-black/20 border-2"
                type="text"
                id="newItem"
                name="newItem"
                placeholder="Digite o nome do novo item"
              />
              <MdAddCircle className="w-6 h-6 mt-3" />
            </div>
          </form>
        </div>
      </div>
      <div
        className="text-center text-[10px] text-white font-bold rounded-b-md bg-[#000000]/60 cursor-pointer"
        onClick={() => setOptStatus(!optStatus)}
      >
        HIDE OPTIONS
      </div>
    </div>
  );
}
