/* EIXO — anexos (fotos / arquivos) com compressão no navegador */
const { useState: useStateA, useRef: useRefA } = React;

/* redimensiona imagem para no máx ~1400px e exporta JPEG comprimido */
function compressImage(file, maxDim = 1400, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const r = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * r); height = Math.round(height * r);
      }
      const cv = document.createElement("canvas");
      cv.width = width; cv.height = height;
      cv.getContext("2d").drawImage(img, 0, 0, width, height);
      const dataUrl = cv.toDataURL("image/jpeg", quality);
      // thumb
      const tMax = 220, tr = Math.min(tMax / width, tMax / height, 1);
      const tcv = document.createElement("canvas");
      tcv.width = Math.round(width * tr); tcv.height = Math.round(height * tr);
      tcv.getContext("2d").drawImage(img, 0, 0, tcv.width, tcv.height);
      resolve({ dataUrl, thumb: tcv.toDataURL("image/jpeg", 0.6) });
    };
    img.onerror = reject;
    img.src = url;
  });
}

const fmtSize = (b) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(0) + " KB" : (b / 1048576).toFixed(1) + " MB";

/* lê arquivo qualquer como dataURL (para PDF etc.) */
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/* ---------------- Painel de anexos ---------------- */
function AttachmentsPanel({ anexos, podeEditar, onAdd, onRemove }) {
  const [busy, setBusy] = useStateA(false);
  const [drag, setDrag] = useStateA(false);
  const [view, setView] = useStateA(null); // anexo aberto no lightbox
  const [erro, setErro] = useStateA("");
  const inputRef = useRefA(null);
  const list = anexos || [];

  const handleFiles = async (files) => {
    setErro(""); setBusy(true);
    const novos = [];
    for (const file of files) {
      try {
        const isImg = file.type.startsWith("image/");
        if (isImg) {
          const { dataUrl, thumb } = await compressImage(file);
          novos.push({ id: "ax-" + Date.now() + "-" + novos.length, nome: file.name, tipo: "image", mime: "image/jpeg", size: Math.round(dataUrl.length * 0.75), data: dataUrl, thumb });
        } else {
          if (file.size > 3 * 1048576) { setErro(`"${file.name}" é grande demais (máx 3 MB para arquivos não-imagem).`); continue; }
          const data = await readAsDataURL(file);
          novos.push({ id: "ax-" + Date.now() + "-" + novos.length, nome: file.name, tipo: "file", mime: file.type || "arquivo", size: file.size, data });
        }
      } catch (e) { setErro("Não consegui processar " + file.name + "."); }
    }
    setBusy(false);
    if (novos.length) onAdd(novos);
  };

  const onInput = (e) => { if (e.target.files.length) handleFiles([...e.target.files]); e.target.value = ""; };
  const onDrop = (e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) handleFiles([...e.dataTransfer.files]); };

  return (
    <div className="ex-mt">
      {podeEditar && (
        <div className={"ex-dropzone" + (drag ? " is-drag" : "")}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)} onDrop={onDrop}
          onClick={() => inputRef.current && inputRef.current.click()}>
          <input ref={inputRef} type="file" accept="image/*,.pdf" multiple hidden onChange={onInput} />
          {busy ? <><span className="ex-spinner ex-spinner--sm" /><span>Processando…</span></>
            : <><span className="ex-dz-ico"><Icons.download size={20} /></span>
                <strong>Adicionar foto ou arquivo</strong>
                <span>Arraste aqui ou clique — fotos são comprimidas automaticamente</span></>}
        </div>
      )}
      {erro ? <div className="ex-login-err" style={{ marginTop: 10 }}><Icons.alert size={14} /> {erro}</div> : null}

      {list.length === 0 ? (
        !podeEditar ? <div className="ex-tl-empty">Nenhum anexo.</div> : null
      ) : (
        <div className="ex-axgrid">
          {list.map((a) => (
            <div className="ex-ax" key={a.id}>
              <button className="ex-ax-thumb" onClick={() => a.tipo === "image" ? setView(a) : downloadAnexo(a)} title={a.nome}>
                {a.tipo === "image"
                  ? <img src={a.thumb || a.data} alt={a.nome} />
                  : <span className="ex-ax-file"><Icons.doc size={26} /><span>{(a.mime.split("/")[1] || "arquivo").toUpperCase()}</span></span>}
              </button>
              <div className="ex-ax-meta">
                <span className="ex-ax-name" title={a.nome}>{a.nome}</span>
                <span className="ex-ax-size">{fmtSize(a.size)}</span>
              </div>
              {podeEditar && <button className="ex-ax-del" onClick={() => onRemove(a.id)} aria-label="Remover anexo"><Icons.x size={13} /></button>}
            </div>
          ))}
        </div>
      )}

      {view && (
        <div className="ex-lightbox" onClick={() => setView(null)}>
          <button className="ex-lb-close" aria-label="Fechar"><Icons.x size={22} /></button>
          <img src={view.data} alt={view.nome} onClick={(e) => e.stopPropagation()} />
          <div className="ex-lb-cap">{view.nome} · {fmtSize(view.size)}</div>
        </div>
      )}
    </div>
  );
}

function downloadAnexo(a) {
  const link = document.createElement("a");
  link.href = a.data; link.download = a.nome;
  document.body.appendChild(link); link.click();
  setTimeout(() => document.body.removeChild(link), 100);
}

Object.assign(window, { AttachmentsPanel, compressImage });
