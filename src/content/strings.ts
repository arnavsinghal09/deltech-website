// Single source for every UI string. Never hardcode text in components.
// Use t("namespace.key") or t("namespace.key", { var: value }) for interpolation.
// Purely decorative / symbol-only content (icons, separators) is the one allowed escape.

export const STRINGS = {
  brand: {
    name: "DelTech MUN",
    tagline: "Model United Nations at Delhi Technological University",
  },

  landing: {
    sectionDetails: "Conference Details",
    sectionAgendas: "Committees & Agendas",
    sectionAwards: "Awards",
    sectionContacts: "Get in Touch",
    dateLabel: "Dates",
    venueLabel: "Venue",
    registrationClosed: "Registrations Closed",
  },

  common: {
    save: "Save",
    cancel: "Cancel",
    next: "Next",
    back: "Back",
    submit: "Submit",
    loading: "Loading…",
    search: "Search",
    export: "Export",
    yes: "Yes",
    no: "No",
    edit: "Edit",
    delete: "Delete",
    confirm: "Confirm",
    close: "Close",
    view: "View details",
    copy: "Copy",
    retry: "Try again",
    continue: "Continue",
    finish: "Finish",
    apply: "Apply",
    reset: "Reset",
    goBack: "Go back",
    uploading: "Uploading…",
    saving: "Saving…",
    sending: "Sending…",
    required: "Required",
    optional: "Optional",
    notAvailable: "N/A",
  },

  nav: {
    home: "Home",
    blog: "Blog",
    register: "Register",
    quizJoin: "Join Quiz",
    adminDashboard: "Dashboard",
    signIn: "Sign in",
    signOut: "Sign out",
    myApplication: "My Application",
  },

  register: {
    pageTitle: "Delegate Registration",
    pageSubtitle: "Complete all steps to submit your application.",
    steps: {
      personal: "Personal Details",
      preferences: "Committee Preferences",
      coDelegateOrPref2: "Co-delegate / Second Preference",
      accommodation: "Accommodation",
      undertaking: "Undertaking & Submit",
    },
    personal: {
      fullNameLabel: "Full name",
      fullNamePlaceholder: "Your full name as on ID",
      emailLabel: "Email address",
      emailPlaceholder: "you@example.com",
      whatsappLabel: "WhatsApp number",
      whatsappPlaceholder: "+91 9876543210",
      altPhoneLabel: "Alternate phone",
      altPhonePlaceholder: "+91 9876543210",
      institutionLabel: "Institution",
      institutionPlaceholder: "Your college or university",
      isDtuLabel: "I am a DTU student",
      munExperienceLabel: "MUN experience",
      munExperiencePlaceholder: "List committees you have attended (if any)",
    },
    preferences: {
      pref1CommitteeLabel: "First preference — committee",
      pref1PortfolioLabel: "First preference — portfolio",
      pref1PortfolioPlaceholder: "Country / role you would like",
      pref2CommitteeLabel: "Second preference — committee",
      pref2PortfolioLabel: "Second preference — portfolio",
      pref2PortfolioPlaceholder: "Country / role you would like",
      unhrcOnlyNote:
        "UNHRC is a double-delegation committee. It will be your only preference.",
    },
    coDelegate: {
      sectionTitle: "Co-delegate details",
      sectionNote:
        "UNHRC requires two delegates per portfolio. Please provide your co-delegate's information.",
      fullNameLabel: "Co-delegate full name",
      emailLabel: "Co-delegate email",
      phoneLabel: "Co-delegate phone",
      institutionLabel: "Co-delegate institution",
      munExperienceLabel: "Co-delegate MUN experience",
    },
    accommodation: {
      sectionTitle: "Accommodation",
      needsLabel: "I need accommodation during the conference",
      outsideNcrLabel: "I am travelling from outside Delhi-NCR",
      note: "Accommodation is on a first-come, first-served basis. Tariff details will be shared over email.",
    },
    undertaking: {
      referenceLabel: "How did you hear about us?",
      referencePlaceholder: "Friend, Instagram, etc.",
      checkboxLabel:
        "I confirm that all information provided is accurate and I agree to abide by the rules of the conference.",
      submitButton: "Submit Application",
    },
    success: {
      title: "Application received!",
      message:
        "Thank you for registering. You will receive an email with your allotment and payment link once the secretariat processes your application.",
    },
    closed: {
      title: "Registrations closed",
    },
  },

  validation: {
    required: "{field} is required.",
    invalidEmail: "Please enter a valid email address.",
    mustAccept: "You must accept the undertaking to proceed.",
    phoneInvalid: "Please enter a valid phone number.",
    minLength: "{field} must be at least {min} characters.",
    maxLength: "{field} must be at most {max} characters.",
    mustSelectCommittee: "Please select a committee.",
    mustSelectPortfolio: "Please enter a portfolio preference.",
    duplicatePreference: "Your two committee preferences must be different.",
    emailAlreadyRegistered:
      "An application with this email already exists.",
  },

  toast: {
    saved: "Changes saved.",
    allotted: "Portfolio allotted successfully.",
    paymentMarkedPaid: "Payment marked as paid.",
    emailSent: "Email sent.",
    importComplete: "{count} delegates imported.",
    errorGeneric: "Something went wrong. Please try again.",
    copied: "Copied to clipboard.",
    deleted: "Record deleted.",
    settingUpdated: "Setting updated.",
    stringOverrideUpdated: "Copy updated.",
    migrationApplied: "Migration applied.",
    statusUpdated: "Status updated.",
    allotmentEmailQueued: "Allotment email queued.",
  },

  empty: {
    noRegistrations: "No registrations yet.",
    noPosts: "No posts yet.",
    noPortfolios: "No portfolios configured for this committee.",
    noResults: "No results match your search.",
    noPayments: "No payment records.",
    noCommittees: "No committees configured.",
    noFees: "No fee rows configured.",
    noStringOverrides: "No copy overrides. All strings use code defaults.",
  },

  admin: {
    nav: {
      overview: "Overview",
      registrations: "Registrations",
      allotment: "Allotment Board",
      payments: "Payments",
      committees: "Committees",
      fees: "Fees",
      blog: "Blog",
      quiz: "Quiz",
      config: "Config",
      strings: "Copy / Strings",
    },
    overview: {
      totalRegistrations: "Total registrations",
      byStatus: "By status",
      byCommittee: "By committee",
      revenueCollected: "Revenue collected",
      accommodationRequests: "Accommodation requests",
      sourceBreakdown: "Source breakdown",
    },
    table: {
      headerName: "Name",
      headerEmail: "Email",
      headerInstitution: "Institution",
      headerCommittee: "Committee",
      headerStatus: "Status",
      headerSource: "Source",
      headerCreatedAt: "Registered",
      headerAmount: "Amount",
      headerPayStatus: "Payment",
      headerActions: "Actions",
      headerKey: "Key",
      headerValue: "Value",
      headerTemplate: "Template",
      headerSentAt: "Sent",
      selectAll: "Select all",
      clearSelection: "Clear selection",
      rowsSelected: "{count} selected",
    },
    drawer: {
      personalSection: "Personal details",
      preferencesSection: "Preferences",
      allotmentSection: "Allotment",
      paymentSection: "Payment",
      emailHistorySection: "Email history",
      coDelegateSection: "Co-delegate",
      editOnBehalf: "Edit on behalf",
      allotPortfolio: "Allot portfolio",
      markPaid: "Mark as paid",
      sendAllotmentEmail: "Send allotment email",
      resendEmail: "Resend",
      cancelRegistration: "Cancel registration",
      addNote: "Add note",
    },
    allotment: {
      selectPortfolio: "Select a portfolio",
      noSuggestions: "No matching candidates for this portfolio.",
      confirmAllot: "Confirm allotment",
      confirmAllotDescription:
        "Allot {portfolio} in {committee} to {delegate}? This cannot be undone.",
      onHoldWarning: "Portfolio is on hold by another admin.",
      doubleAllotError: "This portfolio has already been allotted.",
    },
    config: {
      tabGeneral: "General",
      tabCommittees: "Committees",
      tabFees: "Fees",
      tabStrings: "Copy / Strings",
      registrationToggleLabel: "Registration open",
      addCommittee: "Add committee",
      addPortfolio: "Add portfolio",
      bulkPastePortfolios: "Bulk-paste portfolios",
      bulkPastePlaceholder: "One portfolio per line",
      addFeeRow: "Add fee row",
      searchStrings: "Search copy keys…",
      editString: "Edit copy",
      resetString: "Reset to default",
    },
    import: {
      title: "Import delegates",
      uploadLabel: "Upload .xlsx or .csv",
      mapColumns: "Map columns",
      preview: "Preview",
      commit: "Commit import",
      rowsValid: "{count} rows valid",
      rowsWithErrors: "{count} rows with errors",
      savePreset: "Save column mapping as preset",
    },
  },

  payment: {
    payNowTitle: "Complete your payment",
    scanToPay: "Scan to pay via UPI",
    ivePaid: "I've paid",
    amountDue: "Amount due",
    rupees: "₹{amount}",
    referenceId: "Reference: {id}",
    instructions:
      "Scan the QR code with any UPI app (GPay, PhonePe, Paytm, etc.) and enter the exact amount.",
    pendingNote:
      "Your payment is being verified. This usually takes a few minutes.",
    confirmedNote: "Payment confirmed. Check your email for the allotment details.",
    failedNote: "Payment failed or expired. Please contact the secretariat.",
  },

  status: {
    REGISTERED: "Registered",
    ALLOTTED: "Allotted",
    PAYMENT_SENT: "Payment link sent",
    PAID: "Paid",
    CONFIRMED: "Confirmed",
    CANCELLED: "Cancelled",
    WAITLISTED: "Waitlisted",
    payStatus: {
      PENDING: "Pending",
      SENT: "Link sent",
      PAID: "Paid",
      FAILED: "Failed",
      COMPED: "Comped",
      OFFLINE: "Offline / UPI",
    },
    portfolioStatus: {
      AVAILABLE: "Available",
      ON_HOLD: "On hold",
      ALLOTTED: "Allotted",
      BLOCKED: "Blocked",
    },
    allotmentLabel: "Your allotment",
    yourCommittee: "Committee",
    yourPortfolio: "Portfolio",
    paymentPending: "Payment pending",
    paymentConfirmed: "Payment confirmed",
    applicationConfirmed: "Your application is confirmed.",
  },

  blog: {
    writePlaceholder: "Tell your story…",
    titlePlaceholder: "Title",
    subtitlePlaceholder: "Subtitle (optional)",
    submitForReview: "Submit for review",
    saveDraft: "Save draft",
    pendingBadge: "Pending review",
    approvedBadge: "Published",
    changesRequestedBadge: "Changes requested",
    rejectedBadge: "Rejected",
    reviewNote: "Editor's note",
    readMin: "{n} min read",
    noTagsYet: "No tags",
    addCoverImage: "Add cover image",
    publishedOn: "Published {date}",
    by: "By {name}",
    moderationQueue: "Moderation queue",
    approve: "Approve",
    requestChanges: "Request changes",
    reject: "Reject",
    rejectionReasonPlaceholder: "Reason for rejection",
  },

  quiz: {
    joinPrompt: "Enter your room code to join",
    roomCodePlaceholder: "e.g. 123456",
    joinButton: "Join",
    enterNickname: "Choose a nickname",
    nicknamePlaceholder: "Your display name",
    pickAvatar: "Pick an avatar",
    waitingToStart: "Waiting for the host to start…",
    participantsConnected: "{count} connected",
    answerReceived: "Answer received!",
    correct: "Correct!",
    incorrect: "Not quite.",
    pointsEarned: "+{points} points",
    timeLeft: "{seconds}s",
    votingLocked: "Voting closed",
    leaderboard: "Leaderboard",
    finalResults: "Final results",
    yourRank: "Your rank",
    playAgain: "Play again",
    endSession: "End session",
    nextSlide: "Next",
    prevSlide: "Previous",
    lockVoting: "Lock voting",
    revealResults: "Reveal",
    presentButton: "Present",
    builderTitle: "Quiz builder",
    addSlide: "Add slide",
    slideType: {
      MCQ: "Multiple choice",
      WORDCLOUD: "Word cloud",
      SCALE: "Scale / rating",
      OPEN_TEXT: "Open text",
      CONTENT: "Content slide",
    },
    modes: {
      POLL: "Poll",
      QUIZ: "Quiz (scored)",
    },
  },

  auth: {
    signInTitle: "Sign in to DelTech MUN",
    signInDescription: "Enter your email address and we will send you a magic link.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    sendLinkButton: "Send magic link",
    checkEmailTitle: "Check your inbox",
    checkEmailMessage: "We sent a sign-in link to your email. Click it to continue.",
    checkEmailExpiry: "The link expires in 10 minutes.",
    errorDefault: "Could not send the magic link. Please try again.",
    delegateNote: "No account needed to register as a delegate.",
  },

  email: {
    subjects: {
      registrationReceived: "Your DelTech MUN registration is received",
      allotmentSent: "Your DelTech MUN allotment: {committee} — {portfolio}",
      coDelegateNotice: "You have been added as a co-delegate for {committee}",
      paymentConfirmed: "Payment confirmed — DelTech MUN",
      paymentReminder: "Complete your payment — DelTech MUN",
      blogApproved: 'Your article “{title}” has been published',
      blogChangesRequested: 'Changes requested on “{title}”',
    },
    preview: {
      registrationReceived: "We have your application. Allotments will be sent soon.",
      allotmentSent: "You have been allotted a portfolio. Your payment link is inside.",
      paymentConfirmed: "Your registration is now complete.",
      paymentReminder: "Your allotment is waiting — complete payment to secure your spot.",
    },
  },
} as const;

export type Strings = typeof STRINGS;

// Extracts all leaf dot-paths: "common.save", "register.steps.personal", etc.
type Leaves<T, P extends string = ""> = {
  [K in keyof T]: T[K] extends string
    ? P extends "" ? K & string : `${P}.${K & string}`
    : Leaves<T[K], P extends "" ? K & string : `${P}.${K & string}`>;
}[keyof T];

export type StringKey = Leaves<Strings>;

function getLeaf(obj: unknown, parts: string[]): string | undefined {
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

// Sync helper — uses compiled STRINGS. Safe in client and server components.
// For DB overrides in server components, use getStrings() from @/lib/settings.
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const value = getLeaf(STRINGS, key.split(".")) ?? key;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
