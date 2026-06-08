export function DataState({ loading, error, empty, children }) {
  if (loading) return <div className="screen-state">Carregando...</div>;
  if (error) return <div className="screen-state error">{error}</div>;
  if (empty) return <div className="screen-state">Nenhum registro encontrado.</div>;
  return children;
}
