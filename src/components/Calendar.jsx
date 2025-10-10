import React, { useState } from 'react';

const Calendar = ({ selectedDate, onDateSelect, className = "" }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  // Função para obter o primeiro dia do mês
  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.getDay();
  };

  // Função para obter o número de dias no mês
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Função para navegar entre meses
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Função para verificar se uma data é hoje
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Função para verificar se uma data está selecionada
  const isSelected = (date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  // Nomes dos meses em português
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Nomes dos dias da semana em português
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Gerar dias do calendário
  const generateCalendarDays = () => {
    const firstDay = getFirstDayOfMonth(currentMonth);
    const daysInMonth = getDaysInMonth(currentMonth);
    const days = [];

    // Adicionar dias vazios do mês anterior
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Adicionar dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      days.push(date);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header do calendário */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={goToPreviousMonth}
          className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          type="button"
        >
          <span className="material-symbols-rounded text-lg">chevron_left</span>
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        
        <button
          onClick={goToNextMonth}
          className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          type="button"
        >
          <span className="material-symbols-rounded text-lg">chevron_right</span>
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {dayNames.map((day) => (
          <div key={day} className="bg-gray-50 px-2 py-2 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Dias do calendário */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {calendarDays.map((date, index) => {
          if (!date) {
            return (
              <div key={index} className="bg-white h-10"></div>
            );
          }

          const isSelectedDate = isSelected(date);
          const isTodayDate = isToday(date);

          return (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={`
                relative h-10 text-sm transition-colors
                ${isSelectedDate 
                  ? 'bg-blue-700 text-white font-semibold' 
                  : isTodayDate 
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-900 hover:bg-gray-100'
                }
                ${!isSelectedDate && !isTodayDate ? 'hover:bg-gray-100' : ''}
              `}
              type="button"
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Footer com ações */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => onDateSelect(new Date())}
          className="text-sm text-blue-700 hover:text-blue-800 font-medium transition-colors"
          type="button"
        >
          Hoje
        </button>
        
        {selectedDate && (
          <div className="text-sm text-gray-600">
            Selecionado: {selectedDate.toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
