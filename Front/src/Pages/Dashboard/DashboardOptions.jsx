// /* eslint-disable react/prop-types */
// import { useState, useEffect } from "react";
// import { RiDeleteBin6Line } from "react-icons/ri";
// import { MdAddCircle } from "react-icons/md";
// import { IoClose } from "react-icons/io5";

// export default function DashboardOptions({
//   optStatus,
//   setOptStatus,
//   onFilterChange,
// }) {
//   // Estado para as setlists globais, as selecionadas e o input de nova setlist
//   const [setlists, setSetlists] = useState([]);
//   const [selectedSetlists, setSelectedSetlists] = useState([]);
//   const [newSetlist, setNewSetlist] = useState("");

//   // Busca todas as músicas e extrai somente as setlists de cada uma
//   useEffect(() => {
//     async function fetchSetlists() {
//       const userEmail = localStorage.getItem("userEmail");
//       try {
//         const response = await fetch(
//           `https://api.live.eloygomes.com.br/api/alldata/${userEmail}`
//         );
//         const data = await response.json();
//         // Para cada música, extrai o array "setlist" (se existir)
//         const allSetlists = data.flatMap((song) => song.setlist || []);
//         // Remove duplicatas usando Set
//         const distinctSetlists = [...new Set(allSetlists)];
//         setSetlists(distinctSetlists);
//       } catch (error) {
//         console.error("Erro ao buscar setlists:", error);
//       }
//     }
//     fetchSetlists();
//   }, []);

//   // Atualiza o callback de filtros sempre que os filtros ativos mudam
//   useEffect(() => {
//     if (onFilterChange) {
//       onFilterChange(selectedSetlists);
//     }
//   }, [selectedSetlists, onFilterChange]);

//   const toggleTag = (tag) => {
//     if (selectedSetlists.includes(tag)) {
//       setSelectedSetlists(selectedSetlists.filter((item) => item !== tag));
//     } else {
//       setSelectedSetlists([...selectedSetlists, tag]);
//     }
//   };

//   const handleAddNewSetlist = (e) => {
//     e.preventDefault();
//     const trimmed = newSetlist.trim();
//     if (!trimmed) return;

//     if (!setlists.includes(trimmed)) {
//       setSetlists([...setlists, trimmed]);
//     }

//     setNewSetlist("");
//   };

//   // Remove completamente a setlist tanto do array global quanto do de selecionados
//   const handleDeleteSetlist = (tag) => {
//     setSetlists(setlists.filter((item) => item !== tag));
//     setSelectedSetlists(selectedSetlists.filter((item) => item !== tag));
//   };

//   return (
//     <div className="flex flex-col top-[67px] sticky justify-between neuphormism-b bg-white z-30 h-[300px]">
//       {/* Cabeçalho */}
//       <div className="flex flex-row justify-between py-1 rounded-t-md bg-black/10">
//         <h1 className="px-5 py-2 font-bold text-lg">OPTIONS</h1>
//         <div className="px-5 py-3" onClick={() => setOptStatus(false)}>
//           <IoClose className="w-6 h-6 cursor-pointer" />
//         </div>
//       </div>

//       {/* Corpo principal */}
//       <div className="flex flex-row justify-between p-5">
//         {/* Exibe as setlists (tags) disponíveis */}
//         <div className="w-1/2 pr-2">
//           <label className="block py-2 text-sm font-semibold">
//             Setlists disponíveis:
//           </label>
//           <div className="flex flex-wrap gap-2">
//             {setlists.length === 0 ? (
//               <p className="italic text-sm">Nenhuma setlist cadastrada.</p>
//             ) : (
//               setlists.map((tag, index) => {
//                 const isActive = selectedSetlists.includes(tag);
//                 return (
//                   <div
//                     key={index}
//                     className="flex items-center gap-1"
//                     style={{
//                       display: "inline-flex",
//                       alignItems: "center",
//                       padding: "6px 10px",
//                       borderRadius: "10px",
//                       margin: "2px",
//                       cursor: "pointer",
//                       fontSize: "12px",
//                       backgroundColor: isActive ? "goldenrod" : "#9ca3af",
//                       color: "#fff",
//                       userSelect: "none",
//                     }}
//                   >
//                     {/* Ao clicar, alterna a seleção da tag */}
//                     <span
//                       onClick={() => toggleTag(tag)}
//                       title={
//                         isActive
//                           ? "Clique para remover este filtro"
//                           : "Clique para adicionar este filtro"
//                       }
//                     >
//                       {tag}
//                     </span>
//                     {/* Ícone para remover a tag do sistema */}
//                     <RiDeleteBin6Line
//                       className="w-4 h-4 ml-1"
//                       title="Remover setlist do sistema"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleDeleteSetlist(tag);
//                       }}
//                     />
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </div>

//         {/* Formulário para criar uma nova setlist */}
//         <div className="w-1/2 pl-2">
//           <form className="flex flex-col" onSubmit={handleAddNewSetlist}>
//             <label className="py-2 text-sm font-semibold" htmlFor="newItem">
//               Criar novo setlist:
//             </label>
//             <div className="flex flex-row items-center">
//               <input
//                 className="w-full px-2 py-2.5 rounded-lg border-black/20 border-2"
//                 type="text"
//                 id="newItem"
//                 name="newItem"
//                 placeholder="Digite o nome do novo setlist"
//                 value={newSetlist}
//                 onChange={(e) => setNewSetlist(e.target.value)}
//               />
//               <button
//                 type="submit"
//                 title="Add new setlist"
//                 className="ml-2 text-green-700"
//               >
//                 <MdAddCircle className="w-7 h-7" />
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>

//       {/* Rodapé: botão para ocultar as Options */}
//       <div
//         className="text-center text-[10px] text-white font-bold rounded-b-md bg-[#000000]/60 cursor-pointer p-2"
//         onClick={() => setOptStatus(!optStatus)}
//       >
//         HIDE OPTIONS
//       </div>
//     </div>
//   );
// }

/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdAddCircle } from "react-icons/md";
import { IoClose } from "react-icons/io5";

export default function DashboardOptions({
  optStatus,
  setOptStatus,
  onFilterChange,
}) {
  // Estado para as setlists globais, as selecionadas e o input de nova setlist
  const [setlists, setSetlists] = useState([]);
  const [selectedSetlists, setSelectedSetlists] = useState([]);
  const [newSetlist, setNewSetlist] = useState("");

  // Busca todas as músicas e extrai somente as setlists de cada uma
  useEffect(() => {
    async function fetchSetlists() {
      const userEmail = localStorage.getItem("userEmail");
      try {
        const response = await fetch(
          `https://api.live.eloygomes.com.br/api/alldata/${userEmail}`
        );
        const data = await response.json();
        // Para cada música, extrai o array "setlist" (se existir)
        const allSetlists = data.flatMap((song) => song.setlist || []);
        // Remove duplicatas usando Set
        const distinctSetlists = [...new Set(allSetlists)];
        setSetlists(distinctSetlists);
      } catch (error) {
        console.error("Erro ao buscar setlists:", error);
      }
    }
    fetchSetlists();
  }, []);

  // Atualiza os filtros sempre que os filtros ativos (selectedSetlists) mudam
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(selectedSetlists);
    }
  }, [selectedSetlists]);

  const toggleTag = (tag) => {
    if (selectedSetlists.includes(tag)) {
      setSelectedSetlists(selectedSetlists.filter((item) => item !== tag));
    } else {
      setSelectedSetlists([...selectedSetlists, tag]);
    }
  };

  const handleAddNewSetlist = (e) => {
    e.preventDefault();
    const trimmed = newSetlist.trim();
    if (!trimmed) return;

    if (!setlists.includes(trimmed)) {
      setSetlists([...setlists, trimmed]);
    }
    setNewSetlist("");
  };

  // Remove a setlist dos arrays globais e selecionados
  const handleDeleteSetlist = (tag) => {
    setSetlists(setlists.filter((item) => item !== tag));
    setSelectedSetlists(selectedSetlists.filter((item) => item !== tag));
  };

  return (
    <div className="flex flex-col top-[67px] sticky justify-between neuphormism-b bg-white z-30 h-[300px]">
      {/* Cabeçalho */}
      <div className="flex flex-row justify-between py-1 rounded-t-md bg-black/10">
        <h1 className="px-5 py-2 font-bold text-lg">OPTIONS</h1>
        <div className="px-5 py-3" onClick={() => setOptStatus(false)}>
          <IoClose className="w-6 h-6 cursor-pointer" />
        </div>
      </div>

      {/* Corpo principal */}
      <div className="flex flex-row justify-between p-5">
        {/* Exibe as setlists (tags) disponíveis */}
        <div className="w-1/2 pr-2">
          <label className="block py-2 text-sm font-semibold">
            Setlists disponíveis:
          </label>
          <div className="flex flex-wrap gap-2">
            {setlists.length === 0 ? (
              <p className="italic text-sm">Nenhuma setlist cadastrada.</p>
            ) : (
              setlists.map((tag, index) => {
                const isActive = selectedSetlists.includes(tag);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-1"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 10px",
                      borderRadius: "10px",
                      margin: "2px",
                      cursor: "pointer",
                      fontSize: "12px",
                      backgroundColor: isActive ? "goldenrod" : "#9ca3af",
                      color: "#fff",
                      userSelect: "none",
                    }}
                  >
                    <span
                      onClick={() => toggleTag(tag)}
                      title={
                        isActive
                          ? "Clique para remover este filtro"
                          : "Clique para adicionar este filtro"
                      }
                    >
                      {tag}
                    </span>
                    <RiDeleteBin6Line
                      className="w-4 h-4 ml-1"
                      title="Remover setlist do sistema"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSetlist(tag);
                      }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Formulário para criar uma nova setlist */}
        {/* <div className="w-1/2 pl-2">
          <form className="flex flex-col" onSubmit={handleAddNewSetlist}>
            <label className="py-2 text-sm font-semibold" htmlFor="newItem">
              Criar novo setlist:
            </label>
            <div className="flex flex-row items-center">
              <input
                className="w-full px-2 py-2.5 rounded-lg border-black/20 border-2"
                type="text"
                id="newItem"
                name="newItem"
                placeholder="Digite o nome do novo setlist"
                value={newSetlist}
                onChange={(e) => setNewSetlist(e.target.value)}
              />
              <button
                type="submit"
                title="Add new setlist"
                className="ml-2 text-green-700"
              >
                <MdAddCircle className="w-7 h-7" />
              </button>
            </div>
          </form>
        </div> */}
      </div>

      {/* Rodapé: botão para ocultar as Options */}
      <div
        className="text-center text-[10px] text-white font-bold rounded-b-md bg-[#000000]/60 cursor-pointer py-0"
        onClick={() => setOptStatus(!optStatus)}
      >
        HIDE OPTIONS
      </div>
    </div>
  );
}
