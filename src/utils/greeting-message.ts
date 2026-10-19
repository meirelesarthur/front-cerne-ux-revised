export default function greetingMessage() {
  const greetings = ['Boa madrugada', 'Bom dia', 'Boa tarde', 'Boa noite'];
  const hour = new Date().getHours();
  return greetings[(hour / 6) >> 0];
}
