window.HesteVennConfig = {
  idPrefixes: { users: 'USER', horses: 'HORSE', wishes: 'WISH', requests: 'REQUEST', events: 'EVENT', activities: 'ACTIVITY', qualifications: 'QUALIFICATION', incidents: 'INCIDENT' },
  labels: { users: 'Ryttere', horses: 'Hester', wishes: 'Ønsker', requests: 'Forespørsler', events: 'Arrangementer', activities: 'Aktiviteter', qualifications: 'Kvalifikasjoner', incidents: 'Hendelser' },
  singular: { users: 'user', horses: 'horse', wishes: 'wish', requests: 'request', events: 'event', activities: 'activity', qualifications: 'qualification', incidents: 'incident' },
  descriptions: { users: 'Personer som eier hest, rir eller gjør begge deler.', horses: 'Hester og deres behov, egenskaper og stalltilhørighet.', wishes: 'Rideønsker fra Ryttere og ønsker om ryttere for hester.', requests: 'Forespørsler fra ryttere om å låne en hest på et bestemt tidspunkt.', events: 'Hestearrangementer som Ryttere kan opprette og delta på.', activities: 'Planlagte og gjennomførte aktiviteter mellom hest og rytter.', qualifications: 'Erfaringer og godkjenninger knyttet til en bruker og en hest.', incidents: 'Oppfølging av hendelser og helse rundt hestene.' },
  columns: {
    users: [['name', 'Navn'], ['role', 'Rolle'], ['location', 'Fylke'], ['experienceLevel', 'Erfaringsnivå'], ['active', 'Aktiv']],
    horses: [['name', 'Navn'], ['ownerId', 'Eier'], ['age', 'Alder'], ['breed', 'Rase'], ['location', 'Fylke'], ['experienceRequirement', 'Krever erfaring'], ['active', 'Aktiv']],
    wishes: [['name', 'Ønske'], ['userId', 'Bruker'], ['horseId', 'Hest'], ['location', 'Fylke'], ['ønsketype', 'Ønsketype'], ['aktivitetstype', 'Aktivitetstype'], ['status', 'Status']],
    requests: [['name', 'Forespørsel'], ['wishId', 'Ønske'], ['sender', 'Sender'], ['mottaker', 'Mottaker'], ['horseId', 'Hest'], ['date', 'Dato'], ['startTime', 'Tid'], ['durationHours', 'Varighet'], ['activityType', 'Aktivitet'], ['status', 'Status']],
    events: [['name', 'Navn'], ['location', 'Fylke'], ['date', 'Dato'], ['startTime', 'Tidspunkt'], ['qualifications', 'Kvalifikasjoner']],
    activities: [['name', 'Aktivitet'], ['horseId', 'Hest'], ['userId', 'Rytter'], ['date', 'Dato'], ['activityType', 'Type'], ['status', 'Status']],
    qualifications: [['name', 'Kvalifikasjon'], ['userId', 'Bruker'], ['horseId', 'Hest'], ['qualificationType', 'Type'], ['level', 'Nivå'], ['status', 'Status']],
    incidents: [['name', 'Hendelse'], ['horseId', 'Hest'], ['date', 'Dato'], ['incidentType', 'Type'], ['severity', 'Alvorlighet'], ['status', 'Status']]
  },
  filters: {
    users: [['role', 'Alle roller'], ['location', 'Alle fylker'], ['active', 'Alle statuser']],
    horses: [['breed', 'Alle raser'], ['location', 'Alle fylker'], ['active', 'Alle statuser']],
    wishes: [['location', 'Alle fylker'], ['ønsketype', 'Alle ønsketyper'], ['status', 'Alle statuser']],
    requests: [['status', 'Alle statuser'], ['activityType', 'Alle aktiviteter']],
    events: [['location', 'Alle fylker'], ['qualifications', 'Alle kvalifikasjoner']],
    activities: [['status', 'Alle statuser'], ['activityType', 'Alle typer']],
    qualifications: [['status', 'Alle statuser'], ['level', 'Alle nivåer']],
    incidents: [['status', 'Alle statuser'], ['severity', 'Alle alvorlighetsgrader']]
  },
  detailFields: {
    users: [['role', 'Rolle'], ['location', 'Fylke'], ['experienceLevel', 'Erfaringsnivå'], ['yearsOfExperience', 'År med erfaring'], ['email', 'E-post'], ['phone', 'Telefon'], ['biography', 'Biografi'], ['active', 'Aktiv']],
    horses: [['ownerId', 'Eier'], ['age', 'Alder'], ['breed', 'Rase'], ['gender', 'Kjønn'], ['height', 'Mankehøyde'], ['location', 'Fylke'], ['experienceRequirement', 'Krever erfaring'], ['temperament', 'Temperament'], ['suitableActivities', 'Passer til'], ['description', 'Beskrivelse'], ['active', 'Aktiv']],
    wishes: [['userId', 'Bruker'], ['horseId', 'Hest'], ['location', 'Fylke'], ['størrelsePåHest', 'Størrelse på hest'], ['erfaring', 'Erfaring'], ['ønsketype', 'Ønsketype'], ['aktivitetstype', 'Aktivitetstype'], ['ridestil', 'Ridestil'], ['status', 'Status'], ['qualifications', 'Kvalifikasjoner'], ['comment', 'Kommentar']],
    requests: [['wishId', 'Ønske'], ['sender', 'Sender'], ['mottaker', 'Mottaker'], ['horseId', 'Hest'], ['date', 'Dato'], ['startTime', 'Tidspunkt'], ['durationHours', 'Varighet (timer)'], ['activityType', 'Type aktivitet'], ['status', 'Forespørsel status'], ['comment', 'Kommentar']],
    events: [['organizerId', 'Arrangør'], ['location', 'Fylke'], ['date', 'Dato'], ['startTime', 'Tidspunkt'], ['qualifications', 'Kvalifikasjoner'], ['description', 'Beskrivelse'], ['participantIds', 'Deltakere']],
    activities: [['horseId', 'Hest'], ['userId', 'Sender'], ['mottaker', 'Mottaker'], ['activityType', 'Type'], ['date', 'Dato'], ['startTime', 'Starttid'], ['duration', 'Varighet'], ['location', 'Fylke'], ['status', 'Status'], ['notes', 'Notater']],
    qualifications: [['userId', 'Bruker'], ['horseId', 'Hest'], ['qualificationType', 'Type'], ['level', 'Nivå'], ['status', 'Status'], ['description', 'Beskrivelse'], ['validFrom', 'Gyldig fra'], ['validUntil', 'Gyldig til']],
    incidents: [['horseId', 'Hest'], ['date', 'Dato'], ['incidentType', 'Type'], ['severity', 'Alvorlighet'], ['description', 'Beskrivelse'], ['actionTaken', 'Tiltak'], ['status', 'Status']]
  },
  createLabels: { users: 'profil', horses: 'hest', wishes: 'ønske', requests: 'forespørsel', events: 'arrangement', activities: 'aktivitet', qualifications: 'kvalifikasjon', incidents: 'hendelse' },
  createFields: {
    users: [
      { key: 'image', label: 'Profilbilde', type: 'image', wide: true },
      { key: 'name', label: 'Navn', required: true, autocomplete: 'name' }, { key: 'role', label: 'Rolle', type: 'select', required: true, options: ['Rytter', 'Hesteeier', 'Begge'] },
      { key: 'location', label: 'Fylke', required: true }, { key: 'experienceLevel', label: 'Erfaringsnivå', type: 'select', required: true, options: ['Nybegynner', 'Øvet', 'Erfaren'] },
      { key: 'yearsOfExperience', label: 'År med erfaring', type: 'number', required: true, min: 0, max: 80, value: 0 }, { key: 'email', label: 'E-post', type: 'email' },
      { key: 'phone', label: 'Telefon', type: 'tel' }, { key: 'biography', label: 'Biografi', type: 'textarea', wide: true }
    ],
    horses: [
      { key: 'image', label: 'Bilde av hesten', type: 'image', wide: true },
      { key: 'name', label: 'Navn', required: true }, { key: 'ownerId', label: 'Eier', type: 'reference', source: 'users', required: true },
      { key: 'age', label: 'Alder', type: 'number', min: 0, max: 50, required: true }, { key: 'breed', label: 'Rase', required: true },
      { key: 'gender', label: 'Kjønn', type: 'select', required: true, options: ['Hoppe', 'Vallak', 'Hingst'] }, { key: 'height', label: 'Mankehøyde', placeholder: 'For eksempel 150 cm' },
      { key: 'location', label: 'Fylke', required: true }, { key: 'experienceRequirement', label: 'Krever erfaring', type: 'select', required: true, options: ['Alle nivåer', 'Trygg nybegynner', 'Øvet rytter', 'Erfaren rytter'] },
      { key: 'temperament', label: 'Temperament' }, { key: 'suitableActivities', label: 'Passer til', array: true, placeholder: 'Tur, Dressur, Sprang' },
      { key: 'description', label: 'Beskrivelse', type: 'textarea', wide: true }
    ],
    wishes: [
      { key: 'name', label: 'Navn på ønsket', required: true }, { key: 'userId', label: 'Bruker', type: 'reference', source: 'users' },
      { key: 'horseId', label: 'Hest', type: 'reference', source: 'horses' }, { key: 'location', label: 'Fylke', required: true },
      { key: 'størrelsePåHest', label: 'Størrelse på hest', type: 'select', required: true, options: ['Liten', 'Mellom', 'Stor'] },
      { key: 'erfaring', label: 'Erfaring', type: 'select', required: true, options: ['Nybegynner', 'Lett øvet', 'Erfaren', 'Profesjonell'] },
      { key: 'ønsketype', label: 'Ønsketype', type: 'select', required: true, options: ['Ønsker en rytter', 'Ønsker å Ri'] },
      { key: 'aktivitetstype', label: 'Aktivitetstype', type: 'select', required: true, options: ['Engangstilfelle', 'Månedlig', 'Ukentlig', 'Daglig', 'Periode'] },
      { key: 'ridestil', label: 'Ridestil', type: 'select', required: true, options: ['Tur', 'Dressur', 'Sprang', 'Fôr'] },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['Aktiv', 'Matchet', 'Avsluttet', 'Pause'] },
      { key: 'qualifications', label: 'Kvalifikasjoner', array: true }, { key: 'comment', label: 'Kommentar', type: 'textarea', wide: true }
    ],
    requests: [
      { key: 'wishId', label: 'Ønske', type: 'reference', source: 'wishes', required: true },
      { key: 'sender', label: 'Sender', type: 'reference', source: 'users', required: true },
      { key: 'mottaker', label: 'Mottaker', type: 'reference', source: 'users', required: true },
      { key: 'horseId', label: 'Hest', type: 'reference', source: 'horses', required: true },
      { key: 'date', label: 'Dato', type: 'date', required: true }, { key: 'startTime', label: 'Tidspunkt', type: 'time', required: true },
      { key: 'durationHours', label: 'Varighet (timer)', type: 'number', min: 0.5, max: 12, step: 0.5, value: 1, required: true },
      { key: 'activityType', label: 'Type aktivitet', type: 'select', required: true, options: ['Sprang', 'Dressur', 'Tur', 'Fôr'] },
      { key: 'status', label: 'Forespørsel status', type: 'select', required: true, options: ['Under behandling', 'Godkjent', 'Avslått'] },
      { key: 'comment', label: 'Kommentar', type: 'textarea', wide: true }
    ],
    events: [
      { key: 'name', label: 'Navn', required: true }, { key: 'organizerId', label: 'Arrangør', type: 'reference', source: 'users', required: true },
      { key: 'location', label: 'Fylke', required: true }, { key: 'date', label: 'Dato', type: 'date', required: true },
      { key: 'startTime', label: 'Tidspunkt', type: 'time', required: true },
      { key: 'qualifications', label: 'Kvalifikasjoner', array: true, placeholder: 'For eksempel Trygg på tur, Øvet rytter' },
      { key: 'description', label: 'Beskrivelse', type: 'textarea', wide: true }
    ],
    activities: [
      { key: 'name', label: 'Aktivitet', required: true }, { key: 'horseId', label: 'Hest', type: 'reference', source: 'horses', required: true },
      { key: 'userId', label: 'Rytter', type: 'reference', source: 'users', required: true }, { key: 'activityType', label: 'Type', required: true },
      { key: 'date', label: 'Dato', type: 'date', required: true }, { key: 'startTime', label: 'Starttid', type: 'time', required: true },
      { key: 'duration', label: 'Varighet', placeholder: 'For eksempel 60 min' }, { key: 'location', label: 'Fylke', required: true },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['Planlagt', 'Godkjent', 'Gjennomført', 'Avlyst'] }, { key: 'notes', label: 'Notater', type: 'textarea', wide: true }
    ],
    qualifications: [
      { key: 'name', label: 'Kvalifikasjon', required: true }, { key: 'userId', label: 'Bruker', type: 'reference', source: 'users', required: true },
      { key: 'horseId', label: 'Hest', type: 'reference', source: 'horses', required: true }, { key: 'qualificationType', label: 'Type', required: true },
      { key: 'level', label: 'Nivå', required: true }, { key: 'status', label: 'Status', type: 'select', required: true, options: ['Foreslått', 'Godkjent', 'Utløpt'] },
      { key: 'validFrom', label: 'Gyldig fra', type: 'date' }, { key: 'validUntil', label: 'Gyldig til', type: 'date' }, { key: 'description', label: 'Beskrivelse', type: 'textarea', wide: true }
    ],
    incidents: [
      { key: 'name', label: 'Hendelse', required: true }, { key: 'horseId', label: 'Hest', type: 'reference', source: 'horses', required: true },
      { key: 'date', label: 'Dato', type: 'date', required: true }, { key: 'incidentType', label: 'Type', required: true },
      { key: 'severity', label: 'Alvorlighet', type: 'select', required: true, options: ['Lav', 'Middels', 'Høy'] },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['Åpen', 'Under oppfølging', 'Lukket'] },
      { key: 'description', label: 'Beskrivelse', type: 'textarea', wide: true }, { key: 'actionTaken', label: 'Tiltak', type: 'textarea', wide: true }
    ]
  }
};
