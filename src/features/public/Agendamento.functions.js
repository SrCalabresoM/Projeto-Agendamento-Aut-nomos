import { supabase } from "../../lib/supabase";

const bloqueiosFixos = [
  { start: "09:00", end: "09:20" },
  { start: "12:00", end: "14:00"}
];

//funções para bloquear o horárionão permitido
export function gerarBloqueios(rangeStart, rangeEnd, setBloqueiosGerados) {
  const novos = [];
  const current = new Date(rangeStart);
  current.setHours(0, 0, 0, 0);
  

  while (current < rangeEnd) {
    const dataIso = current.toISOString().split("T")[0];

    bloqueiosFixos.forEach((b, index) => {
      const inicio = new Date(current);
      const [h1, m1] = b.start.split(":");
      inicio.setHours(parseInt(h1), parseInt(m1), 0);
      
      const hoje = new Date().setHours(0,0,0,0);
      if (inicio < hoje) return;

      const fim = new Date(current);
      const [h2, m2] = b.end.split(":");
      fim.setHours(parseInt(h2), parseInt(m2), 0);

      novos.push({
        id: `block-${dataIso}-${index}`,
        start: inicio.toISOString(),
        end: fim.toISOString(),
        display: "background",
        backgroundColor: "#000000"
      });
    });

    current.setDate(current.getDate() + 1);
  }

  setBloqueiosGerados((prev) => {
    const isIgual = prev.length === novos.length && 
                    prev[0]?.id === novos[0]?.id &&
                    prev[prev.length - 1]?.id === novos[novos.length - 1]?.id;
    
    return isIgual ? prev : novos;
  });
}

export function horarioBloqueado(date) {
  const hora = date.getHours();
  const minuto = date.getMinutes();

  return bloqueiosFixos.some(b => {
    const [h1, m1] = b.start.split(":").map(Number);
    const [h2, m2] = b.end.split(":").map(Number);

    const total = hora * 60 + minuto;
    const inicio = h1 * 60 + m1;
    const fim = h2 * 60 + m2;

    return total >= inicio && total < fim;
  });
}

export function repeatEvento(titlee, start, end, profissionalId, user, repeatCount, repeatInterval) {

  let eventos = []

  if (!repeatCount) {
    eventos.push({
      title: titlee,
      start_time: start,
      end_time: end,
      profissional_id: profissionalId,
      client_id: user?.id,
      status: "pendente"
    })
  } else {
    const recurrence_uuid = crypto.randomUUID()
    for (let i = 0; i <= repeatCount; i++) {

      const newStart = new Date(start)
      const newEnd = new Date(end)

      newStart.setDate(newStart.getDate() + (i * repeatInterval))
      newEnd.setDate(newEnd.getDate() + (i * repeatInterval))

      eventos.push({
        recurrence_uuid: recurrence_uuid,
        title: titlee,
        start_time: newStart,
        end_time: newEnd,
        profissional_id: profissionalId,
        client_id: user?.id,
        status: "pendente"
      })
    }
  }

  inserirEvento(eventos)
}

async function inserirEvento(events) { //inserir eventos no banco
  const { error: insertError } = await supabase.from("events").insert(events);
  
  if (insertError) {
    console.log(insertError);
    return;
  }
}

export async function updateEvento(titlee, start, end, eventoSelecionadoId) { 
  const { error: updateError } = await supabase.from("events").update(
    {
      title: titlee,
      start_time: start,
      end_time: end,
    }
  ).eq("id", eventoSelecionadoId)
  if (updateError) {
    console.log(updateError);
    return;
  }
}

export async function updateAll(titlee, start, end, eventRecurrence) {

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("recurrence_uuid", eventRecurrence)

  if (error) {
    console.log(error)
    return
  }

  const novaHoraInicio = new Date(start)
  const novaHoraFim = new Date(end)

  for (const ev of data) {

    const inicio = new Date(ev.start_time)
    const fim = new Date(ev.end_time)

    inicio.setHours(novaHoraInicio.getHours(), novaHoraInicio.getMinutes())
    fim.setHours(novaHoraFim.getHours(), novaHoraFim.getMinutes())

    await supabase
      .from("events")
      .update({
        title: titlee,
        start_time: inicio,
        end_time: fim
      })
      .eq("id", ev.id)
  }
}


export async function setStatus(status, eventoSelecionadoId) { 
  const { error: updateError } = await supabase.from("events").update(
    {
      status: status
    }
  ).eq("id", eventoSelecionadoId)
  if (updateError) {
    console.log(updateError);
    return;
  }
}

export async function deleteEvento(eventoSelecionadoId, setMenuFalse) {
  const { error: deleteError } = await supabase.from("events").delete().eq("id", eventoSelecionadoId)
  if (deleteError) {
    console.log(deleteError);
    return;
  }
  setMenuFalse()
}

export async function deleteAll(eventRecurrence, setMenuFalse) {
  const { error: deleteError } = await supabase.from("events").delete().eq("recurrence_uuid", eventRecurrence)
  if (deleteError) {
    console.log(deleteError);
    return;
  }
  setMenuFalse()
}

export function somarMinutos(hora, duracao) { //função pronta que recebe o horario inicial e a duração e retorna o horário final
  const [h, m] = hora.split(":").map(Number);
  const [, minutos] = duracao.split(":").map(Number);

  const totalMinutos = h * 60 + m + minutos;
  const novaHora = Math.floor(totalMinutos / 60) % 24;
  const novoMinuto = totalMinutos % 60;

  return `${String(novaHora).padStart(2, "0")}:${String(novoMinuto).padStart(2, "0")}`;
}

export function combinarDataHora(data, hora) { //formatar em Date()
  const novaData = new Date(data);
  const [h, m] = hora.split(":").map(Number);

  novaData.setHours(h);
  novaData.setMinutes(m);
  novaData.setSeconds(0);

  return novaData;
}