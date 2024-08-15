const FAKEDATA_2 = {
  "teste@teste.com": [
    {
      id: 1,
      Song: "Snow",
      Artist: "Red Hot Chili Peppers",
      progressBar: 14,
      Instruments: {
        guitar01: true,
        guitar02: false,
        bass: true,
        keys: true,
        drums: false,
        voice: true,
      },
      guitar01: {
        active: true,
        capo: "2 CASA",
        tom: "C Major",
        tuner: "Standard",
        lastPlay: "2010-06-01",
        progressBarG01: 30,
        url: "/presentation/1",
        songCifra:
          "\n" +
          '            <div class="toneFuseAdButton toneFuseAdButton--songAbove pub" id="js-toneFuseAds--songAbove"></div>\n' +
          "\n" +
          '            <span id="cifra_tom">\n' +
          "                            tom:\n" +
          '                <a class="js-modal-trigger" href="#" title="alterar o tom da cifra">G</a>                        </span>\n' +
          "\n" +
          '            <span data-cy="song-tuning" id="cifra_afi">\n' +
          "                        </span>\n" +
          '            <span data-cy="song-capo" id="cifra_capo">\n' +
          "                        </span>\n" +
          "\n" +
          "            <pre>[Intro] <b>Em7</b>  <b>A7</b>  <b>C</b>  <b>G</b>  <b>D9/F#</b>\n" +
          "        <b>Em7</b>  <b>A7</b>  <b>C</b>  <b>G</b>  <b>D9/F#</b> \n" +
          "        <b>Em7</b>  <b>A7</b>  <b>C</b>  <b>G</b>  <b>D9/F#</b> \n" +
          "        <b>Em7</b>  <b>A7</b>  <b>C</b>  <b>G</b>  <b>D9/F#</b>  \n" +
          "        <b>Em</b>  <b>D</b>  <b>C</b>  <b>Am</b>  <b>G</b>  <b>D9/F#</b>  \n" +
          "        <b>Em</b>  <b>D</b>  <b>C</b>  <b>Am</b>  <b>G</b>  <b>D9/F#</b>  \n" +
          "        <b>Em</b>  <b>D</b>  <b>C</b>  <b>Am</b>  <b>G</b>  <b>D9/F#</b>  \n" +
          "        <b>Em</b>  <b>D</b>  <b>C</b>  <b>Am</b>  <b>G</b>  <b>D</b>\n" +
          "\n" +
          '<span class="tablatura">[Tab - Violão Solo Intro]\n' +
          "\n" +
          "   <b>Em7</b>         <b>A7</b>\n" +
          '<span class="cnt">E|<u>------------------</u>0<u>---------------------------------</u>|\n' +
          "B|<u>-----</u>3<u>-----</u>3<u>----</u>2<u>---</u>2<u>-------------------------------</u>|\n" +
          "G|<u>---</u>0<u>-----</u>0<u>----</u>0<u>-------</u>0<u>-----------------------------</u>|\n" +
          "D|<u>-</u>2<u>-----</u>2<u>-----</u>2<u>--------------------------------------</u>|\n" +
          "A|<u>----------------------------------------------------</u>|\n" +
          "E|<u>----------------------------------------------------</u>|</span></span>\n" +
          "\n" +
          '<span class="tablatura">   <b>C</b>           <b>G</b>       <b>D</b>\n' +
          '<span class="cnt">E|<u>---------------</u>3<u>-----</u>2<u>------------------------------</u>|\n' +
          "B|<u>-----</u>1<u>-----</u>1<u>-----</u>3<u>-----</u>3<u>----------------------------</u>|\n" +
          "G|<u>---</u>0<u>-----</u>0<u>---------</u>2<u>-----</u>2<u>--------------------------</u>|\n" +
          "D|<u>-</u>2<u>-----</u>2<u>-----</u>0<u>--------------------------------------</u>|\n" +
          "A|<u>----------------------------------------------------</u>|\n" +
          "E|<u>----------------------------------------------------</u>|</span></span>\n" +
          "\n" +
          '<span class="tablatura">   <b>Em</b>       <b>D</b>          <b>C</b>\n' +
          '<span class="cnt">E|<u>-----</u>10<u>--------</u>7<u>-----------</u>5<u>-</u>3<u>----------------------</u>|\n' +
          "B|<u>---</u>8<u>-------------</u>5<u>-------</u>3<u>-----</u>5<u>-</u>3h5p3<u>--------------</u>|\n" +
          "G|<u>-</u>9<u>------</u>9\\7<u>-</u>7<u>------</u>7\\4<u>-</u>4<u>---------------</u>4\\<u>-----------</u>|\n" +
          "D|<u>----------------------------------------------------</u>|\n" +
          "A|<u>----------------------------------------------------</u>|\n" +
          "E|<u>----------------------------------------------------</u>|</span></span>\n" +
          "\n" +
          '<span class="tablatura">   <b>Am</b>      <b>G</b>        <b>D</b>\n' +
          '<span class="cnt">E|<u>-----------</u>3<u>----------</u>2h3p2<u>-------------------------</u>|\n' +
          "B|<u>---</u>1<u>---------</u>3<u>------</u>3<u>-------</u>3<u>---</u>3<u>-------------------</u>|\n" +
          "G|<u>-----</u>2<u>---------</u>4<u>--</u>2<u>-----------</u>2<u>---</u>2<u>-----------------</u>|\n" +
          "D|<u>-</u>2<u>-----</u>2<u>-</u>0<u>------------------------------------------</u>|\n" +
          "A|<u>----------------------------------------------------</u>|\n" +
          "E|<u>----------------------------------------------------</u>|</span></span>\n" +
          "\n" +
          '<span class="tablatura">[Tab - Violão Base]\n' +
          "\n" +
          "   <b>Em</b>      <b>D</b>       <b>C</b>\n" +
          '<span class="cnt">E|<u>-</u>3<u>-----</u>3<u>-</u>2<u>-----</u>2<u>-</u>0<u>-----</u>0<u>----------------------------</u>|\n' +
          "B|<u>---</u>0<u>-------</u>3<u>-------</u>1<u>-----</u>1<u>--------------------------</u>|\n" +
          "G|<u>-----</u>0<u>-------</u>2<u>-------</u>0<u>-------</u>0<u>----------------------</u>|\n" +
          "D|<u>-</u>2<u>-------</u>0<u>------------------------------------------</u>|\n" +
          "A|<u>-----------------</u>3<u>---------</u>2<u>------------------------</u>|\n" +
          "E|<u>----------------------------------------------------</u>|</span></span>\n" +
          "\n" +
          '<span class="tablatura">   <b>Am</b>      <b>G</b>       <b>D9/F#</b>\n' +
          '<span class="cnt">E|<u>----------------------------------------------------</u>|\n' +
          "B|<u>-</u>1<u>-----</u>1<u>-</u>0<u>-----</u>0<u>--------</u>3<u>---------------------------</u>|\n" +
          "G|<u>---</u>2<u>-------</u>0<u>-----</u>2<u>----</u>2<u>---</u>2<u>---</u>2<u>---------------------</u>|\n" +
          "D|<u>-----</u>2<u>-------</u>0<u>---</u>0<u>--</u>0<u>-------</u>0<u>-----------------------</u>|\n" +
          "A|<u>-</u>0<u>---------------</u>0<u>----------------------------------</u>|\n" +
          "E|<u>---------</u>3<u>-------</u>2<u>----------------------------------</u>|</span></span>\n" +
          "\n" +
          "[Primeira Parte]\n" +
          "\n" +
          "                        <b>G</b>  <b>D</b>  <b>G</b>\n" +
          "Não sou escravo de ninguém\n" +
          "                          <b>D</b>    <b>A5(9)</b>  <b>D</b>\n" +
          "Ninguém, senhor do meu domínio\n" +
          "                     <b>C</b>\n" +
          "Sei o que devo defender\n" +
          "\n" +
          "E, por valor eu tenho\n" +
          "   <b>Em</b>                     <b>A7</b>  <b>D</b>\n" +
          "E temo o que agora se desfaz\n" +
          "\n" +
          "               <b>G</b>     <b>D</b>  <b>G</b>\n" +
          "Viajamos sete léguas\n" +
          "                        <b>D</b>     <b>A5(9)</b>  <b>D</b>\n" +
          "Por entre abismos e florestas\n" +
          "                          <b>C</b>\n" +
          "Por Deus nunca me vi tão só\n" +
          "                          <b>Em</b>\n" +
          "É a própria fé o que destrói\n" +
          "                    <b>A7</b>   <b>D</b>\n" +
          "Estes são dias desleais\n" +
          "\n" +
          "[Refrão]\n" +
          "\n" +
          "          <b>C/G</b>  <b>D9(11)/A</b>\n" +
          "Eu sou metal\n" +
          "                      <b>G</b>  <b>G/F#</b>  <b>Em</b>\n" +
          "Raio, relâmpago e trovão\n" +
          "          <b>C/G</b>  <b>D9(11)/A</b>\n" +
          "Eu sou metal\n" +
          "                         <b>G</b>  <b>G/F#</b>  <b>Em</b>\n" +
          "Eu sou o ouro em seu brasão\n" +
          "          <b>C/G</b>  <b>D9(11)/A</b>\n" +
          "Eu sou metal\n" +
          "                       <b>F7M(11+)</b>  <b>G</b>\n" +
          "Me sabe o sopro do dragão\n" +
          "\n" +
          "[Primeira Parte]\n" +
          "\n" +
          '<span class="tablatura">[Tab - Solo Primeira Parte]\n' +
          "\n" +
          "Parte 1 de 5\n" +
          '<span class="cnt">E|<u>-----</u>3<u>-----</u>3<u>----</u>5<u>-----</u>3<u>-----</u>3<u>-----------------------</u>|\n' +
          "B|<u>---</u>5<u>---</u>5<u>----------</u>5<u>-----</u>5<u>-----</u>5<u>---------------------</u>|\n" +
          "G|<u>-</u>5<u>-------</u>5<u>---</u>5<u>------</u>5<u>-----</u>5<u>-------------------------</u>|\n" +
          "D|<u>----------------------------------------------------</u>|\n" +
          "A|<u>----------------------------------------------------</u>|\n" +
          "E|<u>----------------------------------------------------</u>|</span></span>\n" +
          "\n" +
          '<span class="tablatura">Parte 2 de 5\n' +
          '<span class="cnt">E|<u>---</u>3<u>-----</u>3<u>-----</u>3<u>-----</u>3<u>------------------------------</u>|\n' +
          "B|<u>-----</u>1<u>-----</u>1<u>-----</u>1<u>-----</u>1<u>----------------------------</u>|\n" +
          "G|<u>-</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>--------------------------</u>|\n" +
          "D|<u>----------------------------------------------------</u>|\n" +
          "A|<u>----------------------------------------------------</u>|\n" +
          "E|<u>----------------------------------------------------</u>|</span></span>\n" +
          "\n" +
          '<span class="tablatura">Parte 3 de 5\n' +
          '<span class="cnt">E|<u>---</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>------------------------------</u>|\n' +
          "B|<u>-----</u>3<u>-----</u>3<u>-----</u>3<u>-----</u>3<u>----------------------------</u>|\n" +
          "G|<u>-</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>--------------------------</u>|\n" +
          "D|<u>----------------------------------------------------</u>|\n" +
          "A|<u>----------------------------------------------------</u>|\n" +
          "E|<u>----------------------------------------------------</u>|</span></span>\n" +
          "\n" +
          '<span class="tablatura">Parte 4 de 5\n' +
          '<span class="cnt">E|<u>---</u>1<u>-----</u>1<u>-----</u>1<u>-----</u>1<u>------------------------------</u>|\n' +
          "B|<u>-----</u>1<u>-----</u>1<u>-----</u>1<u>-----</u>1<u>----------------------------</u>|\n" +
          "G|<u>-</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>-----</u>2<u>--------------------------</u>|\n" +
          "D|<u>----------------------------------------------------</u>|\n" +
          "A|<u>----------------------------------------------------</u>|\n" +
          "E|<u>----------------------------------------------------</u>|</span></span>\n" +
          "\n" +
          '<span class="tablatura">Parte 5 de 5\n' +
          '<span class="cnt">E|<u>-----</u>3<u>-----</u>3<u>-----</u>3<u>-----</u>3<u>----------------------------</u>|\n' +
          "B|<u>-------</u>3<u>-----</u>3<u>-----</u>3<u>-----</u>3<u>--------------------------</u>|\n" +
          "G|<u>-</u>2/4<u>-----</u>4<u>-----</u>4<u>-----</u>4<u>-----</u>4<u>------------------------</u>|\n" +
          "D|<u>----------------------------------------------------</u>|\n" +
          "A|<u>----------------------------------------------------</u>|\n" +
          "E|<u>----------------------------------------------------</u>|</span></span>\n" +
          "\n" +
          "<b>C</b>                  <b>Am</b>\n" +
          "  Reconheço meu pesar\n" +
          "        <b>Am/G</b>       <b>D9/F#</b>\n" +
          "Quando tudo é traição\n" +
          "                   <b>F7M(11+)</b>\n" +
          "O que venho encontrar\n" +
          "                       <b>G</b>\n" +
          "É a virtude em outras mãos\n" +
          "\n" +
          "[Segunda Parte]\n" +
          "\n" +
          '<span class="tablatura">[Tab - Solo Segunda Parte]\n' +
          "\n" +
          "[Parte 1 de 2]\n" +
          '<span class="cnt">E|<u>-</u>9/7<u>--</u>5<u>--</u>3<u>--</u>3<u>--</u>2<u>--</u>2h3p2<u>-----</u>2<u>-----------------------</u>|\n' +
          "B|<u>--------------------------</u>3<u>-------------------------</u>|\n" +
          "G|<u>-</u>9/7<u>--</u>6<u>--</u>4<u>--</u>4<u>--</u>2<u>--------</u>2<u>---------------------------</u>|\n" +
          "D|<u>----------------------------------------------------</u>|\n" +
          "A|<u>----------------------------------------------------</u>|\n" +
          "E|<u>----------------------------------------------------</u>|</span></span>\n" +
          "\n" +
          '<span class="tablatura">Parte 2 de 2\n' +
          '<span class="cnt">E|<u>-------</u>3<u>-----</u>3<u>------</u>5\\4<u>-</u>4<u>-----</u>9<u>---------------------</u>|\n' +
          "B|<u>---------</u>3<u>-----</u>3<u>------------------------------------</u>|\n" +
          "G|<u>-</u>2<u>-</u>2/4<u>-----</u>4<u>-----</u>4<u>--</u>6\\4<u>-</u>4<u>-</u>7/9<u>-----------------------</u>|\n" +
          "D|<u>----------------------------------------------------</u>|\n" +
          "A|<u>----------------------------------------------------</u>|\n" +
          "E|<u>----------------------------------------------------</u>|</span></span>\n" +
          "\n" +
          "<b>A7</b>        <b>D</b>\n" +
          "   Minha terra\n" +
          "<b>G</b>      <b>E</b>           <b>A7</b>   <b>D</b>\n" +
          "  É a terra que é minha\n" +
          "            <b>G</b>  <b>E</",
      },
      guitar02: {
        active: false,
        capo: "2 CASA",
        tom: "C Major",
        tuner: "Standard",
        lastPlay: "2010-06-01",
        progressBarG01: 30,
        url: "https://www.cifraclub.com.br/pitty/cachorroquente/",
      },
      bass: {
        active: true,
        capo: "2 CASA",
        tom: "C Major",
        tuner: "Standard",
        lastPlay: "2010-06-01",
        progressBarG01: 30,
        url: "https://www.cifraclub.com.br/pitty/baixaone/",
      },
      keys: {
        active: false,
        capo: "2 CASA",
        tom: "C Major",
        tuner: "Standard",
        lastPlay: "2010-06-01",
        progressBarG01: 30,
        url: "https://www.cifraclub.com.br/pitty/teclasdechocolate/",
      },
      drums: {
        active: true,
        capo: "2 CASA",
        tom: "C Major",
        tuner: "Standard",
        lastPlay: "2010-06-01",
        progressBarG01: 30,
        url: "https://www.cifraclub.com.br/pitty/cramulhaotocandoviola/",
      },
      voice: {
        active: true,
        capo: "2 CASA",
        tom: "C Major",
        tuner: "Standard",
        lastPlay: "2010-06-01",
        progressBarG01: 30,
        url: "https://www.cifraclub.com.br/pitty/voicedodiabo/",
      },
      EmbedVideos: [
        "https://www.youtube.com/watch?v=5e3DUPh3vkg",
        "https://www.youtube.com/watch?v=5e3DUPh3vkg",
        "https://www.youtube.com/watch?v=5e3DUPh3vkg",
      ],
      AddedIn: "2005-12-01",
      UpdateIn: "2010-06-01",
    },
  ],
};

export default FAKEDATA_2;
