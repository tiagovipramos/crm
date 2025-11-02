'use client';

import { Lead } from '@/store/useCRMStore';
import { Phone, Car, AlertCircle, User, DollarSign, Calendar, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
}

export default function LeadCard({ lead, onClick }: LeadCardProps) {
  // Definir badges baseado no status
  const getStatusBadges = () => {
    const badges = [];
    
    // Badge principal do status
    if (lead.status === 'novo') {
      badges.push({ text: 'Não cotado', color: 'bg-orange-500' });
    } else if (lead.status === 'contato-inicial') {
      badges.push({ text: 'Pendente', color: 'bg-blue-500' });
    } else if (lead.status === 'proposta-enviada') {
      badges.push({ text: 'Aprovada', color: 'bg-green-500' });
    } else if (lead.status === 'negociacao') {
      badges.push({ text: 'Pago', color: 'bg-emerald-500' });
    } else if (lead.status === 'fechamento') {
      badges.push({ text: 'Aprovada', color: 'bg-green-600' });
    } else if (lead.status === 'fechado') {
      badges.push({ text: 'Aceita', color: 'bg-green-600' });
    }
    
    // Badge secundário
    badges.push({ text: 'Aceita', color: 'bg-green-500' });
    
    return badges;
  };

  const badges = getStatusBadges();

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all cursor-move group relative"
    >
      {/* Barra colorida no topo */}
      <div className="h-1 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-t-lg" />
      
      <div className="p-3">
        {/* Header com badges */}
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {badges.map((badge, idx) => (
            <span 
              key={idx}
              className={`${badge.color} text-white text-xs px-2 py-0.5 rounded-full font-medium`}
            >
              {badge.text}
            </span>
          ))}
        </div>

        {/* Cliente e data */}
        <div className="mb-2">
          <h4 className="font-semibold text-gray-900 text-sm mb-1">{lead.nome}</h4>
          <p className="text-xs text-gray-500">{formatDate(lead.createdAt)}</p>
        </div>

        {/* Veículo */}
        <div className="mb-3">
          <p className="text-sm text-gray-700 font-medium">{lead.veiculo}</p>
          <p className="text-xs text-gray-500">{lead.placa}</p>
        </div>

        {/* Barra de progresso mockada */}
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Ícones de ação e alertas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Alerta">
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Mensagens">
              <MessageSquare className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Ligar">
              <Phone className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-gray-500">Mensalidade</p>
              <p className="text-sm font-bold text-vipseg-600">{lead.mensalidade}</p>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Badge de ação no canto */}
        <div className="absolute top-2 right-2">
          <button className="w-6 h-6 bg-gray-100 hover:bg-vipseg-600 hover:text-white rounded flex items-center justify-center text-xs font-bold text-gray-600 transition-colors">
            →
          </button>
        </div>
      </div>
    </div>
  );
}
