   document.addEventListener("DOMContentLoaded", () => {
   document.body.classList.remove("light");
  });
    const map = { A: '00', C: '01', G: '10', T: '11' };
    const rev = Object.fromEntries(Object.entries(map).map(([k,v])=>[v,k]));

    const dnaInput = document.getElementById('dnaInput');
    const binaryOut = document.getElementById('binaryOut');
    const decimalOut = document.getElementById('decimalOut');
    const hexOut = document.getElementById('hexOut');
    const gcOut = document.getElementById('gcOut');
    const convertBtn = document.getElementById('convertBtn');
    const clearDna = document.getElementById('clearDna');
    const exampleBtn = document.getElementById('exampleBtn');

    const binaryInput = document.getElementById('binaryInput');
    const decodeBtn = document.getElementById('decodeBtn');
    const dnaOut = document.getElementById('dnaOut');
    const lenOut = document.getElementById('lenOut');
    const uniqOut = document.getElementById('uniqOut');
    const clearBinary = document.getElementById('clearBinary');
    const swapBtn = document.getElementById('swapBtn');

    const copyBinary = document.getElementById('copyBinary');
    const downloadBinary = document.getElementById('downloadBinary');

    const fastaInput = document.getElementById('fastaInput');
    const exportCsv = document.getElementById('exportCsv');
    const exportJson = document.getElementById('exportJson');
    const downloadAll = document.getElementById('downloadAll');
    const toggleThemeBtn = document.getElementById('toggleTheme');

    function sanitizeDNA(s){ return s.toUpperCase().replace(/[^ACGT]/g,''); }
    function dnaToBinary(dna){ return dna.split('').map(ch=>map[ch]).join(''); }
    function binaryToDna(bin){
      if(bin.length%2!==0) throw new Error('Binary length must be multiple of 2');
      return bin.match(/.{2}/g).map(pair=>rev[pair]).join('');
    }
    function computeGC(dna){
      const g = (dna.match(/G/g)||[]).length;
      const c = (dna.match(/C/g)||[]).length;
      return dna.length ? ((g+c)/dna.length)*100 : 0;
    }
    function safeBigIntFromBinary(bin){
      const trimmed = bin.replace(/^0+(?=\d)/,'') || '0';
      try { return BigInt('0b'+trimmed); }
      catch(e){
        let acc = 0n;
        for(let i=0;i<trimmed.length;i+=53){
          const chunk = trimmed.slice(i,i+53);
          acc = (acc<<BigInt(chunk.length)) + BigInt('0b'+chunk);
        }
        return acc;
      }
    }

    convertBtn.addEventListener('click', ()=>{
      const dna = sanitizeDNA(dnaInput.value);
      if(!dna){ alert('Please enter a DNA sequence containing A, C, G or T'); return; }
      try{
        const bin = dnaToBinary(dna);
        binaryOut.textContent = bin;
        const big = safeBigIntFromBinary(bin);
        decimalOut.textContent = big.toString(10);
        hexOut.textContent = big.toString(16).toUpperCase();
        gcOut.textContent = computeGC(dna).toFixed(2)+' %';
        lenOut.textContent = dna.length+' bases';
        uniqOut.textContent = new Set(dna).size;
      }catch(e){ alert(e.message); }
    });

    decodeBtn.addEventListener('click', ()=>{
      const raw = binaryInput.value.replace(/\s+/g,'');
      if(!raw){ alert('Enter binary string'); return; }
      if(!/^[01]+$/.test(raw)){ alert('Binary can contain only 0 and 1'); return; }
      try{
        const dna = binaryToDna(raw);
        dnaOut.textContent = dna;
        lenOut.textContent = dna.length+' bases';
        uniqOut.textContent = new Set(dna).size;
      }catch(e){ alert(e.message); }
    });

    [clearDna, clearBinary].forEach(btn=>{
      btn.addEventListener('click', ()=> {
        dnaInput.value = '';
        binaryInput.value = '';
        binaryOut.textContent = '-';
        decimalOut.textContent = '-';
        hexOut.textContent = '-';
        gcOut.textContent = '-';
        dnaOut.textContent = '-';
        lenOut.textContent = '-';
        uniqOut.textContent = '-';
      });
    });

    exampleBtn.addEventListener('click', ()=> dnaInput.value='AGCTTAGGCTAA');
    swapBtn.addEventListener('click', ()=>{
      [dnaInput.value, binaryInput.value] = [binaryInput.value, dnaInput.value];
    });

    copyBinary.addEventListener('click', async ()=>{
      const txt = binaryOut.textContent;
      if(txt && txt!=='-'){ try{ await navigator.clipboard.writeText(txt); alert('Binary copied to clipboard'); }catch(e){ alert('Copy failed'); } }
    });

    downloadBinary.addEventListener('click', ()=>{
      const txt = binaryOut.textContent;
      if(!txt||txt==='-') return alert('No binary to download');
      const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
      const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='sequence_binary.txt'; a.click(); URL.revokeObjectURL(a.href);
    });

    dnaInput.addEventListener('keydown', e=>{ if(e.ctrlKey && e.key==='Enter') convertBtn.click(); });
    binaryInput.addEventListener('keydown', e=>{ if(e.ctrlKey && e.key==='Enter') decodeBtn.click(); });

    fastaInput.addEventListener('change', function() {
      const file = this.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = e=>{
        const sequence = e.target.result.split(/\r?\n/).filter(line=>!line.startsWith('>')).join('').toUpperCase();
        dnaInput.value = sequence;
        alert('DNA sequence loaded from FASTA file.');
      };
      reader.readAsText(file);
    });

    exportCsv.addEventListener('click', ()=>{
      if(binaryOut.textContent==='-' || decimalOut.textContent==='-') return alert('No data to export');
      const csv = `Field,Value
DNA Sequence,${sanitizeDNA(dnaInput.value)}
Binary,${binaryOut.textContent}
Decimal,${decimalOut.textContent}
Hexadecimal,${hexOut.textContent}
GC Content,${gcOut.textContent}`;
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
      const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='dna_analysis.csv'; a.click(); URL.revokeObjectURL(a.href);
    });

    exportJson.addEventListener('click', ()=>{
      if(binaryOut.textContent==='-' || decimalOut.textContent==='-') return alert('No data to export');
      const data = {
        dna: sanitizeDNA(dnaInput.value),
        binary: binaryOut.textContent,
        decimal: decimalOut.textContent,
        hexadecimal: hexOut.textContent,
        gc_content: gcOut.textContent
      };
      const blob = new Blob([JSON.stringify(data, null,2)], {type:'application/json'});
      const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='dna_analysis.json'; a.click(); URL.revokeObjectURL(a.href);
    });

    downloadAll.addEventListener('click', ()=>{
      if(binaryOut.textContent==='-' || decimalOut.textContent==='-') return alert('No data to download');
      const txt = `DNA Sequence: ${sanitizeDNA(dnaInput.value)}
Binary: ${binaryOut.textContent}
Decimal: ${decimalOut.textContent}
Hexadecimal: ${hexOut.textContent}
GC Content: ${gcOut.textContent}`;
      const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
      const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='dna_results.txt'; a.click(); URL.revokeObjectURL(a.href);
    });

    const currentTheme = localStorage.getItem('theme');
    if(currentTheme==='light') document.body.classList.add('light');

    toggleThemeBtn.addEventListener('click', ()=>{
      document.body.classList.toggle('light');
      localStorage.setItem('theme', document.body.classList.contains('light')?'light':'dark');
    });
