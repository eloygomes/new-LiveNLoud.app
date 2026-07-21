# Matriz de rastreabilidade inicial

| Funcionalidade | Público | Tela/rota | API | Coleção | Evidência/teste | Estado | Responsável |
|---|---|---|---|---|---|---|---|
| Cadastro e aprovação | Usuário pendente | `/userregistration`, `/login` | `/api/v1/auth/signup`, `/api/v1/auth/approve-account` | `authUsers` | `Front/src/Pages/UserRegistration/` | Entregue | Produto/Auth |
| Biblioteca | Músico | `/` | `/api/v1/alldata/:email` | `data` | `Dashboard.test.jsx` | Entregue; contrato requer revisão de segurança | Web/API |
| Nova música | Músico | `/newsong` | `/api/v1/createMusic` | `data`, `Documents` | `NewSong.test.jsx` | Entregue; API requer autenticação | Web/API |
| Setlists | Músico | Dashboard | `/api/v1/updateSetlists` | `data` | testes de Dashboard | Entregue | Web/API |
| Apresentação/LIVE MODE | Músico | `/presentation/:artist/:song/:instrument` | atualização de música/notas | `data` | testes de Presentation | Entregue | Web |
| Offline web | Músico | Login/Dashboard | fila e rotas de dados | armazenamento local + `data` | testes offline do Front | Beta | Web/API |
| Guitar Pro | Músico | Música/Apresentação | `/api/v1/guitarpro/*` | `guitarpro_files` | testes Guitar Pro | Beta | Web/API |
| Calendário | Músico/amigo | `/calendar` | `/api/v1/calendar/events*` | `calendarEvents`, `notifications` | evidência em código | Entregue | Web/API |
| Portal: autorização operacional | Operação | `/operacao/*` | middleware do portal | não se aplica | `tests/auth.test.mjs` | Entregue no scaffold | Documentação |
| Instrumentos e progresso | Músico | `/newsong`, `/editsong/*`, Dashboard | atualização exata/notas/progresso | `data` | testes NewSong/EditSong/Dashboard | Entregue | Web/API |
| Ferramentas musicais web | Músico | `/chordlibrary`, `/tuner`, `/metronome`, `/drum-machine` | majoritariamente cliente | armazenamento local/cliente | testes de ferramentas do Front | Entregue na web | Web |
| Amigos e notificações | Músico/amigo | Perfil, sino e modais | `/api/v1/invitations*`, `/notifications*`, `/friends/*` | `invitations`, `notifications`, `authUsers` | evidência em código | Entregue via REST | Web/API |
| Compartilhamento de setlist | Músico/amigo | Dashboard/notificações | `/api/v1/setlist-shares*` | `setlistShares`, `data` | evidência em código | Entregue | Web/API |
| Extensão do navegador | Músico | Extensão Chrome/Firefox | criação/scraping de música | `data`, `Documents` | manifest e código da extensão | Beta; instalação manual | Extensão/API |
| YouTube e Spotify | Músico | Exportação no Dashboard/callbacks | `/api/v1/youtube/*` e OAuth Spotify | dados temporários/autorização externa | evidência em código | Beta | Web/API |
| Web responsiva no iPhone | Músico | rotas web | mesmas APIs da web | mesmas coleções | decisão de produto; validação por release | Entregue, por navegador | Web |
| Aplicativo React Native | Músico | rotas Expo | API principal | coleções da aplicação + storage local | `npm run test:offline` | Parcial/Beta; sem paridade | Mobile/API |
| Afinador React Native | Músico | não disponível | não aplicável | não aplicável | lacuna confirmada | Planejado | Mobile |
| API principal | Clientes web/mobile/extensão | `/api/v1/*` | Express `index.js` | coleções do produto | sem suíte automatizada | Entregue; autorização incompleta | Backend |
| Scraper | API/importação | serviço Python | `/scrape`, `/generalCifra`, serviço interno | `Documents`, `generalCifras`, `data` | sem suíte integrada organizada | Beta | Backend/Python |
| Admin | Administrador | domínio/painel isolado | Express + FastAPI interna | `adminUsers`, `adminLogs` + leitura do produto | build passa; sem testes reais | Entregue | Admin |
| Autenticação | Todos os clientes | login/cadastro/reset | `/api/v1/auth/*`, `/me` | `authUsers` | evidência em código; E2E ausente | Entregue; revisão de sessão pendente | Backend/Web |
| Documentação técnica | Desenvolvedor | `/desenvolvedor/*` | não se aplica | não se aplica | schema, links, build e testes editoriais | Entregue neste lote | Documentação |
| Deploy frontend | Operação | scripts `deploy/front` | healthcheck e rsync | não se aplica | confirmações, testes/build e healthcheck no script | Entregue; promoção imutável pendente | Operação |
| Deploy backend | Operação | scripts `deploy/back` | Git/Compose/healthcheck | bancos configurados | confirmação e healthcheck no script | Entregue | Operação |
| Backup Mongo atual | Operação | scripts `db/bkp` | mongodump/transferência | `MONGO_DATABASES` | execução manual; restore não comprovado neste lote | Parcial; off-site planejado | Operação |
| Restauração Mongo | Operação | scripts `db/restore` | mongorestore `--drop` | `MONGO_DATABASES` | backup preventivo e healthcheck | Entregue; escopo divergente | Operação |
| Monitoramento externo | Operação | serviço externo futuro | `/health` e checks sintéticos | métricas/logs | inexistente | Planejado | Operação |
| Exclusão LGPD abrangente | Titular/operação | perfil + processo interno | `/deleteUserAccount` e jobs futuros | todas as coleções/arquivos | auditoria incompleta | Parcial/planejado | Produto/Segurança |
| Runbooks protegidos | Operação | `/operacao/*` | não se aplica | não se aplica | autorização, schema, links e build | Entregue neste lote | Documentação |

Última validação: commit `2cb3f8f`, 16/07/2026. A matriz cresce junto com as próximas páginas.
