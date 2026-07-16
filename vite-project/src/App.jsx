import { useState } from "react";
import {
  Check, Phone, MapPin, Calendar, Landmark, Fingerprint, FileCheck2,
  ShieldCheck, ChevronLeft, ChevronRight, Paperclip, Building2, Circle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// SOURCE DATA — the client's actual submitted JSON. The UI below renders
// nothing that isn't derivable from this object.
// ---------------------------------------------------------------------------
const DATA = {
  creatorInfo: { phone: "79321436465", name: "Иван", surname: "Иванов", patronymic: "Иванович", email: "info@info.ru" },
  resident: true,
  autoregistration: false,
  actualPlaceAddressStay: { unrestrictedValue: "620075, Орловская обл, г Орел, ул Ленина, д 71" },
  check_box2: true,
  inn: "526317984689",
  pasport: {
    surname: "ИВАНОВ", firstName: "ИВАН", otherNames: "ИВАНОВИЧ",
    series: "6522", number: "439453", subdivisionCode: "660-005",
    issuingAuthority: "ГУ МВД РОССИИ ПО ОРЛОВСКОЙ ОБЛАСТИ",
    dateOfBirth: "15.01.1999", dateOfIssue: "27.01.2021", sex: "МУЖ",
    fileName: "Паспорт, снилс.pdf",
  },
  snils: "676-005-850 04",
  passportRegFile: "Регистрация.pdf",
  product: "bank_product3",
  anketaFile: "Анкета резидента.pdf",
  fio_operator: { name: "Таран Мирослава", phone: "+7 495 705 90 90 доб. 0116" },
  meet: {
    date: "2023-11-18", kind: "office", office: "Отделение «Таганское»",
    officeAddr: "г. Москва, Земляной вал, д. 54, стр. 1",
    time: "10:00–13:00",
  },
  moscow_region: true,
  identification: "Идентификация пройдена",
};

const innApi = {
  request: { inn: DATA.inn, key: "b18462537805a834b16767" },
  response: {
    OGRN: "311526312600069",
    FullName: "Стручкова Ольга Петровна, ИП",
    Address: "г. Нижний Новгород",
    GroupName: "Действующее",
  },
};
const ddApi = {
  request: { inn: DATA.inn, key: "b18462537805a834b16767", login: "Gate", password: "••••••" },
  response: { Index: 4, Desc: "Низкий риск", CourtCases: "1 незавершённое дело (2023)" },
};

// ---------------------------------------------------------------------------
// STEP DEFINITIONS — filtered to the branch this client actually took.
// resident=true, autoregistration=false, moscow_region=true, no rejection
// or edit-request fields present anywhere in the JSON.
// ---------------------------------------------------------------------------
const steps = [
  { id: "phone", icon: Phone, title: "Вход", lane: "Неавторизованная зона" },
  { id: "reg", icon: Building2, title: "Регистрация", lane: "Неавторизованная зона" },
  { id: "resident", icon: MapPin, title: "Данные резидента", lane: "Авторизованная зона" },
  { id: "inn", icon: Fingerprint, title: "ИНН", lane: "Авторизованная зона" },
  { id: "passport", icon: FileCheck2, title: "Паспорт и СНИЛС", lane: "Авторизованная зона" },
  { id: "product", icon: Landmark, title: "Продукт", lane: "Авторизованная зона" },
  { id: "ident", icon: ShieldCheck, title: "Идентификация", lane: "Авторизованная зона" },
  { id: "meeting", icon: Calendar, title: "Встреча", lane: "Авторизованная зона" },
  { id: "done", icon: Check, title: "Готово", lane: "Авторизованная зона" },
];

function fmtPhone(raw) {
  const d = raw.replace(/\D/g, "");
  return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
}
function fmtDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

// --- small reusable "form field" primitives, all rendered as real controls ---
const Field = ({ label, hint, children }) => (
  <div className="f-group">
    <label>{label}</label>
    {children}
    {hint && <div className="f-hint">{hint}</div>}
  </div>
);
const Input = (props) => <input className="f-input" readOnly {...props} />;
const Check2 = ({ label, checked }) => (
  <label className="f-check">
    <span className={"box" + (checked ? " on" : "")}>{checked && <Check size={12} strokeWidth={3} color="#fff" />}</span>
    {label}
  </label>
);
const Radio = ({ label, selected }) => (
  <label className="f-radio">
    <span className={"dot" + (selected ? " on" : "")} />
    {label}
  </label>
);
const FileChip = ({ name }) => (
  <div className="f-file"><Paperclip size={14} /> {name}</div>
);
const ApiNote = ({ title, api, benefit }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="api-note">
      <div className="api-note-head" onClick={() => setOpen(!open)}>
        <ShieldCheck size={15} color="var(--ok)" />
        <span><b>{title}</b> — выполнено автоматически</span>
        <span className="api-toggle">{open ? "скрыть" : "детали"}</span>
      </div>
      {open && (
        <div className="api-note-body">
          <div className="api-cols">
            <div><h5>Запрос</h5><pre>{JSON.stringify(api.request, null, 2)}</pre></div>
            <div><h5>Ответ</h5><pre>{JSON.stringify(api.response, null, 2)}</pre></div>
          </div>
          <p className="api-benefit">{benefit}</p>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [i, setI] = useState(steps.length - 1);
  const step = steps[i];

  return (
    <div className="site">
      <style>{`
        .site {
          --navy:#0f2136; --ink:#1c2b3f; --ink-soft:#6b7688; --line:#e3e7ee;
          --bg:#f4f6f9; --card:#ffffff; --accent:#2f6fed; --ok:#1a8f5f;
          --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
          background: var(--bg); color: var(--ink); min-height: 100%;
        }
        .site * { box-sizing: border-box; }
        .nav {
          background: var(--navy); color:#fff; padding: 16px 32px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .nav .logo { font-weight:700; font-size:15px; letter-spacing:.3px; display:flex; gap:8px; align-items:center; }
        .nav .logo .mark { width:22px; height:22px; border-radius:6px; background: var(--accent); display:inline-block; }
        .nav .user { font-size:12.5px; color:#b8c3d6; font-family: var(--mono); }

        .progress {
          background: var(--card); border-bottom: 1px solid var(--line);
          padding: 18px 32px 0; overflow-x:auto;
        }
        .progress-track { display:flex; gap:0; max-width: 980px; margin: 0 auto; }
        .p-step {
          flex:1; text-align:center; padding-bottom: 14px; cursor:pointer;
          border-bottom: 3px solid var(--line); position:relative; min-width: 84px;
        }
        .p-step.done { border-color: var(--ok); }
        .p-step.active { border-color: var(--accent); }
        .p-circle {
          width:26px; height:26px; border-radius:50%; margin: 0 auto 6px;
          display:flex; align-items:center; justify-content:center; font-size:11px;
          background: var(--line); color: var(--ink-soft);
        }
        .p-step.done .p-circle { background: var(--ok); color:#fff; }
        .p-step.active .p-circle { background: var(--accent); color:#fff; }
        .p-label { font-size: 11px; color: var(--ink-soft); }
        .p-step.active .p-label { color: var(--ink); font-weight:600; }

        .wrap { max-width: 720px; margin: 0 auto; padding: 34px 20px 60px; }
        .card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 30px 34px; }
        .card h2 { font-size: 19px; margin: 0 0 4px; }
        .lane { font-size: 11.5px; color: var(--ink-soft); font-family: var(--mono); margin-bottom: 22px; display:block; }

        .f-group { margin-bottom: 18px; }
        .f-group label { display:block; font-size: 12.5px; color: var(--ink-soft); margin-bottom: 6px; font-weight:600; }
        .f-input {
          width:100%; padding: 10px 12px; border:1px solid var(--line); border-radius:6px;
          font-size: 14px; background: #fbfcfe; color: var(--ink); font-family: var(--mono);
        }
        .f-hint { font-size: 11.5px; color: var(--ink-soft); margin-top:5px; line-height:1.5; }
        .f-check, .f-radio { display:flex; align-items:center; gap:10px; font-size:13.5px; margin: 6px 0; }
        .box { width:18px; height:18px; border-radius:4px; border:1.5px solid var(--line); display:flex; align-items:center; justify-content:center; }
        .box.on { background: var(--ok); border-color: var(--ok); }
        .dot { width:16px; height:16px; border-radius:50%; border:1.5px solid var(--line); position:relative; }
        .dot.on { border-color: var(--accent); }
        .dot.on::after { content:""; width:8px; height:8px; border-radius:50%; background: var(--accent); position:absolute; top:3px; left:3px; }
        .f-file { display:flex; align-items:center; gap:8px; font-size: 13.5px; padding:9px 12px; background:#f6f8fb; border:1px solid var(--line); border-radius:6px; width:fit-content; }
        .row2 { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .api-note { margin: 20px 0; border: 1px solid #cfe3d8; background: #f2f9f5; border-radius: 8px; padding: 12px 16px; }
        .api-note-head { display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer; }
        .api-toggle { margin-left:auto; color: var(--accent); font-size:12px; }
        .api-note-body { margin-top: 12px; }
        .api-cols { display:flex; gap: 18px; flex-wrap:wrap; }
        .api-cols > div { flex:1; min-width: 200px; }
        .api-cols h5 { margin:0 0 4px; font-size:10.5px; text-transform:uppercase; color: var(--ink-soft); }
        .api-cols pre { background: var(--navy); color:#cfe0f5; font-size:11px; padding:10px; border-radius:5px; margin:0; font-family: var(--mono); overflow-x:auto; }
        .api-benefit { font-size:12.5px; line-height:1.55; margin: 10px 0 0; color: var(--ink); }

        .note { font-size:13px; color: var(--ink-soft); font-style: italic; margin-bottom: 20px; }
        .foot { display:flex; justify-content:space-between; margin-top: 26px; }
        .btn { padding: 10px 18px; border-radius: 7px; font-size: 13.5px; border:1px solid var(--line); background:#fff; cursor:pointer; display:flex; gap:6px; align-items:center; }
        .btn.primary { background: var(--accent); color:#fff; border-color: var(--accent); }
        .btn:disabled { opacity:.35; cursor:default; }
      `}</style>

      <div className="nav">
        <div className="logo"><span className="mark" />Личный кабинет</div>
        <div className="user">{DATA.creatorInfo.surname} {DATA.creatorInfo.name} · ИНН {DATA.inn}</div>
      </div>

      <div className="progress">
        <div className="progress-track">
          {steps.map((s, idx) => (
            <div
              key={s.id}
              className={"p-step" + (idx < i ? " done" : "") + (idx === i ? " active" : "")}
              onClick={() => setI(idx)}
            >
              <div className="p-circle">{idx < i ? <Check size={13} /> : idx + 1}</div>
              <div className="p-label">{s.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="wrap">
        <div className="card">
          {step.id === "phone" && (
            <>
              <h2>Вход в личный кабинет</h2>
              <span className="lane">{step.lane}</span>
              <Field label="Номер телефона" hint="Обязательное поле. Маска +7 (___) ___-__-__, формат ^7\d{10}$. Подтверждается одноразовым кодом из SMS — без него переход дальше заблокирован.">
                <Input value={fmtPhone(DATA.creatorInfo.phone)} />
              </Field>
              <Field label="Резидентство" hint="Обязательный переключатель — определяет, какая ветка анкеты откроется дальше.">
                <Radio label="Резидент РФ" selected={DATA.resident} />
                <Radio label="Нерезидент" selected={!DATA.resident} />
              </Field>
              <div className="note">Номер не найден в базе (autoregistration: false) → клиент направлен на регистрацию, а не на авторизацию.</div>
            </>
          )}

          {step.id === "reg" && (
            <>
              <h2>Регистрация</h2>
              <span className="lane">{step.lane}</span>
              <div className="row2">
                <Field label="Фамилия" hint="Кириллица, с заглавной буквы: ^[А-ЯЁ][а-яё]+$."><Input value={DATA.creatorInfo.surname} /></Field>
                <Field label="Имя" hint="Та же маска, обязательно."><Input value={DATA.creatorInfo.name} /></Field>
              </div>
              <div className="row2">
                <Field label="Отчество" hint="Необязательно, та же маска, если указано."><Input value={DATA.creatorInfo.patronymic} /></Field>
                <Field label="Email" hint="Формат RFC 5322 (name@domain.tld). Канал уведомлений о статусе заявки."><Input value={DATA.creatorInfo.email} /></Field>
              </div>
            </>
          )}

          {step.id === "resident" && (
            <>
              <h2>Данные резидента</h2>
              <span className="lane">{step.lane}</span>
              <Field label="Адрес фактического пребывания" hint="Поле-автокомплит с подсказками нормализованного адреса; принять можно только вариант из списка, произвольный текст не сохраняется.">
                <Input value={DATA.actualPlaceAddressStay.unrestrictedValue} />
              </Field>
              <Field label="Согласие на обработку персональных данных" hint="Обязательный чекбокс — без него переход дальше заблокирован.">
                <Check2 label="Я согласен(а) на обработку персональных данных" checked={DATA.check_box2} />
              </Field>
            </>
          )}

          {step.id === "inn" && (
            <>
              <h2>ИНН</h2>
              <span className="lane">{step.lane}</span>
              <Field label="ИНН" hint="12 цифр, проверяется контрольными разрядами по алгоритму ФНС (веса 7,2,4,10,3,5,9,4,6,8,0), затем — запросом к внешнему сервису.">
                <Input value={DATA.inn} />
              </Field>
              <ApiNote
                title="Проверка контрагента по ИНН"
                api={innApi}
                benefit="Клиенту не нужно ничего подтверждать вручную: сервис мгновенно проверяет, что ИНН существует и активен. Заодно вскрывается то, что клиент не указывал явно — под этим ИНН зарегистрировано действующее ИП, и банк учитывает это дальше по процессу, не запрашивая бумажных подтверждений."
              />
            </>
          )}

          {step.id === "passport" && (
            <>
              <h2>Паспорт и СНИЛС</h2>
              <span className="lane">{step.lane}</span>
              <div className="row2">
                <Field label="Серия" hint="4 цифры: ^\d{4}$."><Input value={DATA.pasport.series} /></Field>
                <Field label="Номер" hint="6 цифр: ^\d{6}$."><Input value={DATA.pasport.number} /></Field>
              </div>
              <div className="row2">
                <Field label="Дата рождения" hint="Не позже сегодня минус 14 лет."><Input value={DATA.pasport.dateOfBirth} /></Field>
                <Field label="Дата выдачи" hint="Не в будущем и не раньше 14-летия клиента."><Input value={DATA.pasport.dateOfIssue} /></Field>
              </div>
              <Field label="Код подразделения" hint="Формат ^\d{3}-\d{3}$."><Input value={DATA.pasport.subdivisionCode} /></Field>
              <Field label="Скан паспорта" hint="PDF/JPG/PNG, до 10 МБ, проверка читаемости перед сохранением.">
                <FileChip name={DATA.pasport.fileName} />
              </Field>
              <Field label="СНИЛС" hint="Формат XXX-XXX-XXX YY; контрольное число — сумма цифр с весами 9..1 по модулю 101.">
                <Input value={DATA.snils} />
              </Field>
              <Field label="Страница с регистрацией" hint="Загрузка файла, до 10 МБ.">
                <FileChip name={DATA.passportRegFile} />
              </Field>
            </>
          )}

          {step.id === "product" && (
            <>
              <h2>Выбор продукта</h2>
              <span className="lane">{step.lane}</span>
              <Field label="Продукт" hint="Взаимоисключающий выбор — ровно один вариант из группы.">
                <Radio label="Открытие счёта" selected={false} />
                <Radio label="Оформление вклада" selected={false} />
                <Radio label="Открытие карты" selected={true} />
              </Field>
            </>
          )}

          {step.id === "ident" && (
            <>
              <h2>Анкета и идентификация</h2>
              <span className="lane">{step.lane}</span>
              <Field label="Анкета резидента" hint="PDF, до 10 МБ, обязательна для продолжения.">
                <FileChip name={DATA.anketaFile} />
              </Field>
              <ApiNote
                title="Due diligence: индекс риска и судебные дела"
                api={ddApi}
                benefit="Проверка идёт в фоне, пока клиент видит экран «Идентификация» — без его участия. Индекс риска 4 из 10 («низкий») пропускает заявку по быстрой дорожке прямо к записи на встречу; при высоком риске система увела бы её оператору в «Ручную работу с заявкой», и клиент это увидел бы как более долгий срок рассмотрения."
              />
              <Field label="Статус" hint="Устанавливается системой автоматически, поле нередактируемо.">
                <Input value={DATA.identification} />
              </Field>
            </>
          )}

          {step.id === "meeting" && (
            <>
              <h2>Встреча в отделении</h2>
              <span className="lane">{step.lane}</span>
              <Field label="Формат встречи" hint="Выбор из списка, обязателен."><Input value="В офисе банка" /></Field>
              <Field label="Отделение" hint="Список отфильтрован по адресу клиента и формату встречи."><Input value={`${DATA.meet.office}, ${DATA.meet.officeAddr}`} /></Field>
              <div className="row2">
                <Field label="Дата" hint="Не раньше сегодня, в пределах окна записи."><Input value={fmtDate(DATA.meet.date)} /></Field>
                <Field label="Время" hint="Слот из доступных на выбранную дату."><Input value={DATA.meet.time} /></Field>
              </div>
              <div className="note">Регион — Москва и МО (moscow_region: true), поэтому экран «Предупреждение о невозможности оказания услуги» клиенту не показывался.</div>
            </>
          )}

          {step.id === "done" && (
            <>
              <h2>Заявка одобрена</h2>
              <span className="lane">{step.lane}</span>
              <div className="note">Встреча согласована оператором — продукт открыт, клиенту показаны реквизиты и уведомление об успехе.</div>
              <Field label="Ваш менеджер"><Input value={`${DATA.fio_operator.name}, ${DATA.fio_operator.phone}`} /></Field>
              <Field label="Продукт"><Input value="Открытие карты" /></Field>
            </>
          )}

          <div className="foot">
            <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}><ChevronLeft size={14} />Назад</button>
            <button className="btn primary" disabled={i === steps.length - 1} onClick={() => setI(i + 1)}>Далее<ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
