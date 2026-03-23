import React, { useEffect, useState } from "react";
import { useGetSettings, useUpdateSettings, useRestartBot, BotSettings } from "@workspace/api-client-react";
import { Save, Power, ShieldAlert, Cpu, Type, Fingerprint, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const [formData, setFormData] = useState<BotSettings>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMut = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        toast({ title: "Configuration Updated", description: "Settings saved successfully." });
        queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      },
      onError: () => toast({ title: "Update Failed", variant: "destructive" })
    }
  });

  const restartMut = useRestartBot({
    mutation: {
      onSuccess: () => toast({ title: "Reboot Initiated", description: "Bot core is restarting..." }),
      onError: () => toast({ title: "Reboot Failed", variant: "destructive" })
    }
  });

  const handleChange = (field: keyof BotSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateMut.mutate({ data: formData });
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">System Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">Adjust core operational parameters</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => restartMut.mutate()}
            disabled={restartMut.isPending}
            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/20 font-medium flex items-center transition-colors disabled:opacity-50"
          >
            <Power className={`w-4 h-4 mr-2 ${restartMut.isPending ? 'animate-pulse' : ''}`} />
            Force Restart
          </button>
          <button 
            onClick={handleSave}
            disabled={updateMut.isPending}
            className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 font-medium flex items-center shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all disabled:opacity-50"
          >
            {updateMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Core Settings */}
        <div className="bg-card rounded-2xl border border-white/5 p-6 shadow-xl">
          <div className="flex items-center mb-6">
            <Cpu className="w-5 h-5 text-primary mr-3" />
            <h3 className="font-bold text-white">Core Identification</h3>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Bot Alias</label>
              <input 
                type="text" value={formData.botName || ""} onChange={e => handleChange('botName', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Command Prefix</label>
              <input 
                type="text" value={formData.prefix || ""} onChange={e => handleChange('prefix', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Master Override Number</label>
              <input 
                type="text" value={formData.ownerNumber || ""} onChange={e => handleChange('ownerNumber', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Max Session Capacity</label>
              <input 
                type="number" value={formData.maxSessions || 0} onChange={e => handleChange('maxSessions', parseInt(e.target.value, 10))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* Behavioral Toggles */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-white/5 p-6 shadow-xl">
            <div className="flex items-center mb-6">
              <Type className="w-5 h-5 text-accent mr-3" />
              <h3 className="font-bold text-white">Automated Behaviors</h3>
            </div>
            
            <div className="space-y-4">
              <ToggleRow 
                label="Auto Read Receipts" 
                description="Automatically mark incoming signals as read"
                checked={!!formData.autoRead} 
                onChange={(c: boolean) => handleChange('autoRead', c)} 
              />
              <div className="h-px w-full bg-white/5" />
              <ToggleRow 
                label="Simulate Typing" 
                description="Show typing indicator during process execution"
                checked={!!formData.autoTyping} 
                onChange={(c: boolean) => handleChange('autoTyping', c)} 
              />
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-white/5 p-6 shadow-xl">
            <div className="flex items-center mb-6">
              <ShieldAlert className="w-5 h-5 text-yellow-500 mr-3" />
              <h3 className="font-bold text-white">Security & Access</h3>
            </div>
            
            <div className="space-y-4">
              <ToggleRow 
                label="Maintenance Mode" 
                description="Lock out all external commands"
                checked={!!formData.maintenanceMode} 
                onChange={(c: boolean) => handleChange('maintenanceMode', c)} 
                warning
              />
              <div className="h-px w-full bg-white/5" />
              <ToggleRow 
                label="NSFW Filters" 
                description="Enable explicit content modules"
                checked={!!formData.nsfwEnabled} 
                onChange={(c: boolean) => handleChange('nsfwEnabled', c)} 
              />
              <div className="h-px w-full bg-white/5" />
              <div className="pt-2">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center"><Fingerprint className="w-3 h-3 mr-2"/> Premium Code Validation</label>
                <input 
                  type="password" value={formData.premiumCode || ""} onChange={e => handleChange('premiumCode', e.target.value)}
                  placeholder="Enter license key..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange, warning }: any) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="pr-4">
        <h4 className={`text-sm font-medium ${warning ? 'text-yellow-400' : 'text-white'}`}>{label}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? (warning ? 'bg-yellow-500' : 'bg-primary') : 'bg-white/10'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
