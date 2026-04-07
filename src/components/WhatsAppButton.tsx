import { MessageCircle } from 'lucide-react';
import { WHATSAPP_URL } from '../lib/siteConfig';

export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 left-8 z-[100] glass-strong rounded-full p-4 hover:scale-110 transition-all duration-300 pulse-animation shadow-2xl"
      style={{
        boxShadow: '0 0 30px rgba(37, 211, 102, 0.5)',
      }}
    >
      <MessageCircle className="w-8 h-8 text-[#25D366]" />
    </a>
  );
}
