import { Shield, Lock, FileCheck, HelpCircle, ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { isRealFirebase } from '../firebase';

export default function PortalGuidelines() {
  const features = [
    {
      icon: Lock,
      title: "End-to-End Session Security",
      desc: "VaultiX uses robust authentication rules. Files uploaded to your path are secured using custom Firestore parameters, preventing unauthorized public discovery.",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100"
    },
    {
      icon: Shield,
      title: "Zero-Trust Document Isolation",
      desc: "Through absolute user-route encapsulation, each designer/client workspace relies on a strict path verification layer checking matching key-signatures.",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100"
    },
    {
      icon: FileCheck,
      title: "Immutable History Logs",
      desc: "Once a file is finalized in the database, its parameters are write-locked and immutable. Clients only hold delete and download privileges to guarantee consistency.",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100"
    },
    {
      icon: KeyRound,
      title: "Client-Designer Interlocking",
      desc: "Designers can confidently distribute unique invitation links. Dropped client collateral maps natively into distinct secure nodes instantly.",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100"
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs" id="guidelines-container">
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold text-slate-800 tracking-tight flex items-center gap-2">
          <span>Portal Guidelines & Security Overview</span>
        </h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Welcome to VaultiX, the secure files dispatch portal. Here is a breakdown of how our zero-trust system guarantees that every design asset, document draft, or database spreadsheet you submit remains private and protected.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex gap-4 p-5 rounded-2xl border border-slate-100 hover:border-indigo-500/15 hover:bg-slate-50/50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.color} flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-850 tracking-tight">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ box */}
        <div className="mt-8 bg-slate-50 border border-slate-200/60 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <span>Frequently Asked Questions</span>
          </h3>
          <div className="space-y-4 mt-4 text-xs text-slate-650 leading-relaxed">
            <div>
              <p className="font-semibold text-slate-900">Where are my files actually saved?</p>
              <p className="text-slate-500 mt-0.5">
                {isRealFirebase 
                  ? "Your files are encrypted and processed sequentially as Base64 binaries, stored natively in the Firestore Enterprise database, secured by Firebase Security Rules."
                  : "Your files are securely contained inside the sandboxed local storage profile of this web browser container, protecting them from remote access."
                }
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Why is there a file size restriction of 2.0MB?</p>
              <p className="text-slate-500 mt-0.5">
                Because files are embedded inside Firestore documents to eliminate the need for secondary storage servers. Enforcing a strict 2.0MB limit maintains rapid uploads and safe page downloads.
              </p>
            </div>
          </div>
        </div>

        {/* Action footnote */}
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mt-8">
          <span>Ready to start managing files? Explore the Files Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
