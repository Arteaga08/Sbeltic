// Aviso de Privacidad para el historial clínico que el paciente captura
// desde el link público (LFPDPPP — datos personales sensibles de salud).
//
// ⚠️ IMPORTANTE: Reemplaza los textos entre [CORCHETES] por los datos legales
// reales de la clínica (razón social, domicilio y correo para derechos ARCO).
// Si modificas el contenido del aviso, incrementa PRIVACY_NOTICE_VERSION para
// que la evidencia de consentimiento guardada refleje qué versión aceptó cada
// paciente.

export const PRIVACY_NOTICE_VERSION = "2026-05-29-v1";

export const PRIVACY_NOTICE_RESPONSIBLE =
  "Sbeltic [RAZÓN SOCIAL], con domicilio en [DOMICILIO FISCAL]";

export const PRIVACY_NOTICE_ARCO_CONTACT = "[CORREO PARA DERECHOS ARCO]";

export const PRIVACY_NOTICE_SECTIONS = [
  {
    title: "Responsable del tratamiento",
    body: `${PRIVACY_NOTICE_RESPONSIBLE} es responsable del tratamiento y protección de sus datos personales.`,
  },
  {
    title: "Datos que recabamos",
    body: "Datos de identificación y contacto, así como datos personales sensibles relativos a su salud: antecedentes heredofamiliares, patológicos, ginecológicos, hábitos, alergias y motivo de consulta.",
  },
  {
    title: "Finalidad",
    body: "Brindarle atención médica, integrar y resguardar su expediente clínico conforme a la NOM-004-SSA3-2012, dar seguimiento a sus tratamientos y mantener contacto con usted.",
  },
  {
    title: "Datos personales sensibles",
    body: "Le informamos que tratamos datos personales sensibles (datos de salud), por lo que se requiere su consentimiento expreso para su tratamiento, conforme al artículo 9 de la LFPDPPP.",
  },
  {
    title: "Derechos ARCO",
    body: `Usted puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición, así como limitar el uso o divulgación de sus datos, enviando su solicitud a ${PRIVACY_NOTICE_ARCO_CONTACT}.`,
  },
  {
    title: "Transferencias",
    body: "No transferimos sus datos a terceros sin su consentimiento, salvo las excepciones previstas en el artículo 37 de la LFPDPPP.",
  },
];

export const PRIVACY_CONSENT_LABEL =
  "He leído y acepto el Aviso de Privacidad y otorgo mi consentimiento expreso para el tratamiento de mis datos personales sensibles (datos de salud).";
