SP=/tmp/claude-1000/-home-pietro-ambiente/573685d7-0cbe-45d5-82b6-020d81e9fd72/scratchpad
cd /home/pietro/ambiente/GB.Cerne.FrontEnd
set -a; source .env.login; set +a
# roda ANTES da limpeza (run5 espera ALLDONE4; este espera ALLDONE3 e termina antes? nao garante) -> run6 so inicia apos ALLDONE4 e a limpeza (run5) espera ALLDONE6
until grep -q ALLDONE4 $SP/run4.status 2>/dev/null; do sleep 5; done
ONLY=C02,C03,C04,C05,C06,C07,C10,C11 flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config e2e/_102-legado/playwright.legado.config.ts s5-exp-pag -g E12 > $SP/run-s5b.log 2>&1; echo "s5b EXIT=$?" >> $SP/run6.status
echo ALLDONE6 >> $SP/run6.status
