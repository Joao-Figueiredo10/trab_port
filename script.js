(() => {
  const root = document.documentElement;
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];
  const resultCard = document.querySelector('#result-card');
  const scoreRing = document.querySelector('#score-ring');
  const scoreValue = document.querySelector('#score-value');
  const meterFoot = document.querySelector('#meter-foot');
  const verdictOverline = document.querySelector('#verdict-overline');
  const resultTitle = document.querySelector('#result-title');
  const resultSummary = document.querySelector('#result-summary');
  const diagnosis = document.querySelector('#camouflage-diagnosis');
  const vieiraNote = document.querySelector('#vieira-note');
  const resultId = document.querySelector('#result-id');
  const matchDetails = document.querySelector('#match-details');
  const quickButtons = [...document.querySelectorAll('.quick-case')];
  const phraseInput = document.querySelector('#phrase-input');
  const startButton = document.querySelector('#start-scan');
  const inputError = document.querySelector('#input-error');
  const characterCount = document.querySelector('#character-count');
  const progressBox = document.querySelector('#scan-progress');
  const progressBar = document.querySelector('#progress-bar');
  const progressFill = document.querySelector('#progress-fill');
  const progressPercent = document.querySelector('#progress-percent');
  let scanSequence = 0;
  let scanToken = 0;
  let progressFrame = 0;

  const cases = {
    interest: {
      score: 99, state: 'polvo', verdict: '99% POLVO DETETADO', overline: 'CAMUFLAGEM DE INTERESSE',
      summary: 'A lealdade aparece depois do sucesso — e vem acompanhada de um pedido.',
      diagnosis: 'Camuflagem de interesse: uma amizade retroactiva que muda de cor quando a maré fica favorável.',
      note: 'Em paráfrase do Capítulo V: o polvo disfarça a traição sob uma aparência mansa.',
      matches: 'SINAIS: ELOGIO TARDIO · SUCESSO · OPORTUNIDADE',
    },
    honest: {
      score: 0, state: 'clean', verdict: '0% POLVO — PEIXE LIMPO', overline: 'SINCERIDADE SEM DISFARCE',
      summary: 'Um aviso em privado, com intenção de ajudar, não revela os sinais de camuflagem do caso.',
      diagnosis: 'Sinceridade sem disfarce: apontar um erro em privado para ajudar a melhorar é cuidado, não ataque.',
      note: 'A franqueza que ajuda a corrigir um erro não precisa de se mascarar de amizade.',
      matches: 'SINAIS: AJUDA · PRIVACIDADE · INTENÇÃO CONSTRUTIVA',
    },
    judas: {
      score: 100, state: 'judas', verdict: '100% POLVO (NÍVEL JUDAS)', overline: 'DISSIMULAÇÃO MÁXIMA',
      summary: 'A agressão pelas costas e o abraço em público formam o padrão do mal disfarçado de bem.',
      diagnosis: 'Abraço de tentáculos: ataca pelas costas e usa a proximidade em público como disfarce.',
      note: 'Vieira denuncia o mal escondido sob aparência mansa — o inimigo disfarçado de amigo.',
      matches: 'SINAIS: FALA PELAS COSTAS · ABRAÇO PÚBLICO · DISFARCE',
    },
  };

  function setTab(activeTab, focus = false) {
    const activeId = activeTab.getAttribute('aria-controls');
    tabs.forEach((tab) => {
      const active = tab === activeTab;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.classList.toggle('is-active', active);
      if (active && focus) tab.focus();
    });
    panels.forEach((panel) => { panel.hidden = panel.id !== activeId; });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setTab(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      setTab(tabs[next], true);
    });
  });

  function paintResult(result, sourceLabel) {
    root.dataset.scanResult = result.state;
    resultCard.dataset.result = result.state;
    resultCard.classList.remove('is-scanning');
    scoreRing.style.setProperty('--score', `${result.score}%`);
    scoreRing.setAttribute('aria-valuenow', String(result.score));
    scoreValue.innerHTML = `${result.score}<small>%</small>`;
    meterFoot.textContent = result.score === 0 ? 'SEM SINAIS DE POLVO' : result.score === 100 ? 'RISCO MÁXIMO' : 'SINAIS DETECTADOS';
    verdictOverline.textContent = result.overline;
    resultTitle.textContent = result.verdict;
    resultSummary.textContent = result.summary;
    diagnosis.textContent = result.diagnosis;
    vieiraNote.textContent = result.note;
    matchDetails.textContent = result.matches;
    scanSequence += 1;
    resultId.textContent = `${sourceLabel} / ${String(scanSequence).padStart(3, '0')}`;
  }

  function resetScanUi() {
    scanToken += 1;
    if (progressFrame) window.cancelAnimationFrame(progressFrame);
    progressFrame = 0;
    progressBox.hidden = true;
    progressBox.classList.remove('is-running');
    resultCard.classList.remove('is-scanning');
    startButton.disabled = false;
    startButton.querySelector('span:first-child').textContent = 'Iniciar Scan';
  }

  quickButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const result = cases[button.dataset.case];
      if (!result) return;
      resetScanUi();
      quickButtons.forEach((item) => item.classList.toggle('is-selected', item === button));
      paintResult(result, `CASO ${button.dataset.case.toUpperCase()}`);
    });
  });

  const riskSignals = [
    { pattern: /\bsempre\s+(?:acreditei|soube|disse|apoiei)\b/g, points: 26, label: 'lealdade retroactiva' },
    { pattern: /\bagora\s+que\b/g, points: 18, label: 'mudança após a ocasião' },
    { pattern: /\b(?:sucesso|famos[oa]?|viral|conseguiste|resultou)\b/g, points: 12, label: 'sucesso como contexto' },
    { pattern: /\b(?:vip|bilhetes?|convite|palco|fotografia)\b/g, points: 15, label: 'acesso ou visibilidade' },
    { pattern: /\b(?:nunca apoiou|nunca esteve|so aparece|aparece agora|so se lembra)\b/g, points: 21, label: 'presença de conveniência' },
    { pattern: /\b(?:nas costas|pelas costas|fala mal|falou mal)\b/g, points: 34, label: 'ataque pelas costas' },
    { pattern: /\b(?:abraca|abraco|abracou|finge|fingiu|falso|falsa|hipocrisia|trai|traiu|judas)\b/g, points: 22, label: 'dissimulação explícita' },
    { pattern: /\b(?:so agora|de repente|depois do sucesso|sempre fui teu amigo)\b/g, points: 17, label: 'aproximação tardia' },
  ];
  const constructiveSignals = [
    { pattern: /\b(?:em privado|em particular|para te ajudar|ajudar a melhorar|ajudei a melhorar|avisou|avisei|sinceramente|honestamente|com cuidado)\b/g, points: 22, label: 'intenção construtiva' },
  ];

  function normalize(text) {
    return text.toLocaleLowerCase('pt-PT').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ');
  }
  function matchCount(pattern, text) {
    pattern.lastIndex = 0;
    return [...text.matchAll(pattern)].length;
  }
  function analyzeText(rawText) {
    const text = normalize(rawText);
    const interestExample = /nunca apoiou/.test(text) && /sempre acreditei/.test(text) && /sucesso/.test(text);
    const judasExample = /(?:nas costas|pelas costas)/.test(text) && /(?:abraca|abraco)/.test(text);
    const helpfulExample = /(?:em privado|em particular)/.test(text) && /(?:ajudar|ajudei|avisou|avisei)/.test(text) && /(?:melhorar|erro)/.test(text);
    if (interestExample) return { ...cases.interest };
    if (judasExample) return { ...cases.judas };
    if (helpfulExample) return { ...cases.honest };

    let score = 8;
    const foundRisk = [];
    const foundGood = [];
    riskSignals.forEach(({ pattern, points, label }) => {
      const count = matchCount(pattern, text);
      if (!count) return;
      score += Math.min(count, 2) * points;
      foundRisk.push(label);
    });
    constructiveSignals.forEach(({ pattern, points, label }) => {
      const count = matchCount(pattern, text);
      if (!count) return;
      score -= Math.min(count, 2) * points;
      foundGood.push(label);
    });
    score = Math.max(0, Math.min(100, Math.round(score)));

    let state = 'clean';
    let verdict = 'PEIXE LIMPO — SEM SINAL FORTE';
    let overline = 'POUCOS INDÍCIOS DE CAMUFLAGEM';
    let summary = 'A frase não mostra sinais fortes de oportunismo. O contexto e as atitudes continuam a contar.';
    let camouflage = 'Sinceridade sem disfarce: não foram detectados padrões fortes de interesse ou traição nesta mensagem.';
    let note = 'Um diagnóstico não substitui a leitura do contexto: observa as atitudes para lá das palavras.';
    let matches = foundGood.length ? `SINAIS: ${foundGood.join(' · ').toUpperCase()}` : 'SINAIS: SEM PADRÃO FORTE DETECTADO';

    if (score >= 30) {
      state = score >= 95 ? 'judas' : 'polvo';
      verdict = score >= 95 ? `${score}% POLVO (NÍVEL JUDAS)` : `${score}% POLVO DETETADO`;
      overline = score >= 95 ? 'DISSIMULAÇÃO MÁXIMA' : 'CAMUFLAGEM SOB OBSERVAÇÃO';
      summary = score >= 95 ? 'A mensagem acumulou vários sinais de dissimulação. Confirma-os à luz das atitudes e do contexto.' : 'Há sinais de conveniência na frase. Verifica se o padrão se repete antes de tirar conclusões.';
      camouflage = score >= 95 ? 'Abraço de tentáculos: a mensagem cruza elogio oportunista, interesse ou dissimulação.' : 'Mudança de cor na pedra: a mensagem pode estar a adaptar a amizade à ocasião.';
      note = 'Em paráfrase do Capítulo V: Vieira alerta para o mal disfarçado de bem e para o inimigo com aparência de amigo.';
      matches = foundRisk.length ? `SINAIS: ${foundRisk.join(' · ').toUpperCase()}` : 'SINAIS: PADRÃO A CONFIRMAR';
    } else if (score >= 15) {
      state = 'polvo';
      verdict = `${score}% — SINAL A VIGIAR`;
      overline = 'CAMUFLAGEM SUBTIL';
      summary = 'Apareceu um indício que merece contexto — uma frase, por si só, não fecha o diagnóstico.';
      camouflage = 'Camuflagem subtil: observa se a aproximação depende do que a outra pessoa pode oferecer.';
      note = 'A lição de Vieira convida a desconfiar da aparência; a leitura justa exige olhar para o padrão inteiro.';
      matches = foundRisk.length ? `SINAL: ${foundRisk.join(' · ').toUpperCase()}` : 'SINAL: MENÇÃO AMBÍGUA';
    }
    return { score, state, verdict, overline, summary, diagnosis: camouflage, note, matches };
  }

  function startScan() {
    const rawText = phraseInput.value.trim();
    if (!rawText) {
      inputError.hidden = false;
      phraseInput.setAttribute('aria-invalid', 'true');
      phraseInput.focus();
      return;
    }
    resetScanUi();
    const activeToken = scanToken;
    inputError.hidden = true;
    phraseInput.removeAttribute('aria-invalid');
    startButton.disabled = true;
    startButton.querySelector('span:first-child').textContent = 'A analisar…';
    progressBox.hidden = false;
    progressBox.classList.add('is-running');
    progressPercent.textContent = '0%';
    progressBar.setAttribute('aria-valuenow', '0');
    progressFill.style.transition = 'width 35ms linear';
    progressFill.style.width = '0';
    resultCard.classList.add('is-scanning');

    const startedAt = performance.now();
    function updateProgress(now) {
      if (activeToken !== scanToken) return;
      const percent = Math.min(100, Math.floor(((now - startedAt) / 1500) * 100));
      progressPercent.textContent = `${percent}%`;
      progressBar.setAttribute('aria-valuenow', String(percent));
      progressFill.style.width = `${percent}%`;
      if (percent < 100) {
        progressFrame = window.requestAnimationFrame(updateProgress);
        return;
      }
      const result = analyzeText(rawText);
      progressBox.classList.remove('is-running');
      progressBox.hidden = true;
      startButton.disabled = false;
      startButton.querySelector('span:first-child').textContent = 'Iniciar Scan';
      paintResult(result, 'TEXTO LIVRE');
      progressFrame = 0;
    }
    progressFrame = window.requestAnimationFrame(updateProgress);
  }

  startButton.addEventListener('click', startScan);
  phraseInput.addEventListener('input', () => {
    characterCount.textContent = `${phraseInput.value.length} / 600`;
    if (phraseInput.value.trim()) {
      inputError.hidden = true;
      phraseInput.removeAttribute('aria-invalid');
    }
  });
  phraseInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) startScan();
  });
})();
