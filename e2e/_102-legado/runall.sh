cd /home/pietro/ambiente/GB.Cerne.FrontEnd
set -a; source .env.login; set +a
for s in s1-mov-estado s8-rateio s2-mov-fin s3-mov-transf s4-exp s5-exp-pag; do
  G=""; [ "$s" = "s1-mov-estado" ] && G="-g E4"
  flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config e2e/_102-legado/playwright.legado.config.ts $s $G > /tmp/claude-1000/-home-pietro-ambiente/573685d7-0cbe-45d5-82b6-020d81e9fd72/scratchpad/run-$s.log 2>&1
  echo "$s EXIT=$?" >> /tmp/claude-1000/-home-pietro-ambiente/573685d7-0cbe-45d5-82b6-020d81e9fd72/scratchpad/runall.status
done
echo ALLDONE >> /tmp/claude-1000/-home-pietro-ambiente/573685d7-0cbe-45d5-82b6-020d81e9fd72/scratchpad/runall.status
