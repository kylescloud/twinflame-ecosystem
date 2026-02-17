import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, CheckCircle, Upload, User, MapPin, FileText, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type KYCStatus = "unverified" | "pending" | "verified";

interface KYCModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  kycStatus: KYCStatus;
  setKycStatus: (s: KYCStatus) => void;
}

const STEPS = ["Personal Info", "Address", "Identity Document", "Review & Submit"];

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "Japan", "South Korea", "Singapore", "Switzerland",
  "Netherlands", "Sweden", "Norway", "Brazil", "India", "Other",
];

const ID_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "national_id", label: "National ID Card" },
];

const KYCVerificationModal = ({ open, onClose, onComplete, kycStatus, setKycStatus }: KYCModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idFrontName, setIdFrontName] = useState("");
  const [idBackName, setIdBackName] = useState("");
  const [selfieName, setSelfieName] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [accreditedInvestor, setAccreditedInvestor] = useState(false);

  const handleFilePick = (setter: (n: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max file size is 10 MB.", variant: "destructive" });
        return;
      }
      setter(file.name);
    }
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 0:
        return !!(firstName.trim() && lastName.trim() && email.trim() && dateOfBirth && nationality);
      case 1:
        return !!(street.trim() && city.trim() && postalCode.trim() && country);
      case 2:
        return !!(idType && idNumber.trim() && idFrontName);
      case 3:
        return termsAccepted && accreditedInvestor;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    setKycStatus("pending");
    toast({
      title: "KYC Submitted",
      description: "Your identity verification is being reviewed. This typically takes 1–3 business days.",
    });
    onComplete();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--equity))]">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">KYC Verification</h2>
                <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-1 px-6 pt-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-[hsl(var(--equity))]" : "bg-border"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            {/* Step 0: Personal Info */}
            {step === 0 && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <User className="h-4 w-4 text-[hsl(var(--equity))]" />
                  <span>Provide your legal name as it appears on your ID</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">First Name *</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Last Name *</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" maxLength={100} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email Address *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" maxLength={255} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date of Birth *</Label>
                  <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nationality *</Label>
                  <Select value={nationality} onValueChange={setNationality}>
                    <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 1: Address */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4 text-[hsl(var(--equity))]" />
                  <span>Your current residential address</span>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Street Address *</Label>
                  <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="123 Main Street" maxLength={200} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">City *</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">State / Region</Label>
                    <Input value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} placeholder="NY" maxLength={100} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Postal Code *</Label>
                    <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="10001" maxLength={20} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Country *</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Identity Document */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <FileText className="h-4 w-4 text-[hsl(var(--equity))]" />
                  <span>Upload a government-issued photo ID</span>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Document Type *</Label>
                  <Select value={idType} onValueChange={setIdType}>
                    <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
                    <SelectContent>
                      {ID_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Document Number *</Label>
                  <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="AB1234567" maxLength={50} />
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Front of ID *", name: idFrontName, setter: setIdFrontName },
                    { label: "Back of ID (optional)", name: idBackName, setter: setIdBackName },
                    { label: "Selfie with ID (optional)", name: selfieName, setter: setSelfieName },
                  ].map((doc) => (
                    <div key={doc.label} className="space-y-1.5">
                      <Label className="text-xs">{doc.label}</Label>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-background/50 p-3 transition-colors hover:border-[hsl(var(--equity))]/50 hover:bg-muted/30">
                        <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm text-muted-foreground">
                          {doc.name || "Click to upload (JPG, PNG, PDF — max 10MB)"}
                        </span>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFilePick(doc.setter)} />
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <>
                <div className="rounded-lg border border-border bg-background/30 p-4 space-y-3 text-sm">
                  <h3 className="font-semibold text-foreground">Review Your Information</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground">
                    <span>Name</span><span className="text-foreground">{firstName} {lastName}</span>
                    <span>Email</span><span className="text-foreground truncate">{email}</span>
                    <span>Date of Birth</span><span className="text-foreground">{dateOfBirth}</span>
                    <span>Nationality</span><span className="text-foreground">{nationality}</span>
                    <span>Address</span><span className="text-foreground">{street}, {city} {postalCode}</span>
                    <span>Country</span><span className="text-foreground">{country}</span>
                    <span>ID Type</span><span className="text-foreground capitalize">{idType.replace("_", " ")}</span>
                    <span>ID Number</span><span className="text-foreground">{idNumber}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <p className="text-xs text-muted-foreground">
                    By submitting, you confirm that all information provided is accurate. False information may result in account suspension and forfeiture of tokens.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(v) => setTermsAccepted(v === true)}
                    />
                    <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      I agree to the Terms of Service, Privacy Policy, and consent to identity verification processing. *
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="accredited"
                      checked={accreditedInvestor}
                      onCheckedChange={(v) => setAccreditedInvestor(v === true)}
                    />
                    <Label htmlFor="accredited" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      I confirm that I am an accredited investor or qualify under applicable exemptions in my jurisdiction. *
                    </Label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-card px-6 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => step > 0 ? setStep(step - 1) : onClose()}
              className="text-muted-foreground"
            >
              {step > 0 ? "Back" : "Cancel"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                size="sm"
                disabled={!canAdvance()}
                onClick={() => setStep(step + 1)}
                className="bg-[hsl(var(--equity))] text-primary-foreground hover:opacity-90"
              >
                Continue
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!canAdvance()}
                onClick={handleSubmit}
                className="bg-[hsl(var(--equity))] text-primary-foreground hover:opacity-90"
              >
                <CheckCircle className="mr-1.5 h-4 w-4" />
                Submit Verification
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default KYCVerificationModal;
export type { KYCStatus };
