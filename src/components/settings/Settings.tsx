import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Settings as SettingsIcon,
  User,
  Building,
  Wifi,
  WifiOff,
  Shield,
  Bell,
  Printer,
  Database,
  Smartphone,
  Monitor,
  Save,
  RefreshCw,
  Download,
  Upload
} from "lucide-react";

const Settings = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [settings, setSettings] = useState({
    pharmacy: {
      name: "Al-Shifa Pharmacy",
      address: "Block A, Gulberg III, Lahore",
      phone: "+92 42 1234567",
      email: "info@alshifapharmacy.com",
      license: "PHR-LHR-2024-001",
      taxNumber: "1234567890123"
    },
    pos: {
      autoSync: true,
      offlineMode: true,
      receiptPrinter: "EPSON TM-T20II",
      barcodePrinter: "Zebra ZD220",
      defaultTax: 17,
      lowStockAlert: 20,
      expiryAlert: 30
    },
    user: {
      name: "Ahmad Khan",
      role: "Cashier",
      deviceId: "TABLET-001",
      lastLogin: "2024-01-15 10:30 AM"
    },
    security: {
      autoLogout: 30,
      requirePin: true,
      encryptData: true,
      backupEnabled: true,
      auditLog: true
    },
    notifications: {
      lowStock: true,
      expiry: true,
      sales: false,
      sync: true,
      errors: true
    }
  });

  const deviceStatus = {
    connectivity: isOnline ? "Online" : "Offline",
    lastSync: "2 minutes ago",
    storage: "2.3 GB / 32 GB",
    battery: "78%",
    printer: "Connected"
  };

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your pharmacy POS configuration</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Now
          </Button>
          <Button className="text-white bg-[linear-gradient(135deg,#1C623C_0%,#247449_50%,#6EB469_100%)] hover:opacity-90">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Device Status */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="w-5 h-5 text-primary" />
            <span>Device Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {isOnline ? (
                  <Wifi className="w-8 h-8 text-success" />
                ) : (
                  <WifiOff className="w-8 h-8 text-warning" />
                )}
              </div>
              <p className="text-sm font-medium text-foreground">{deviceStatus.connectivity}</p>
              <p className="text-xs text-muted-foreground">Connection</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="w-8 h-8 text-accent" />
              </div>
              <p className="text-sm font-medium text-foreground">{deviceStatus.lastSync}</p>
              <p className="text-xs text-muted-foreground">Last Sync</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">{deviceStatus.storage}</p>
              <p className="text-xs text-muted-foreground">Storage</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Shield className="w-8 h-8 text-success" />
              </div>
              <p className="text-sm font-medium text-foreground">{deviceStatus.battery}</p>
              <p className="text-xs text-muted-foreground">Battery</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Printer className="w-8 h-8 text-warning" />
              </div>
              <p className="text-sm font-medium text-foreground">{deviceStatus.printer}</p>
              <p className="text-xs text-muted-foreground">Printer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pharmacy Information */}
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-primary" />
              <span>Pharmacy Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pharmacy-name">Pharmacy Name</Label>
              <Input
                id="pharmacy-name"
                value={settings.pharmacy.name}
                onChange={(e) => handleSettingChange('pharmacy', 'name', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pharmacy-address">Address</Label>
              <Input
                id="pharmacy-address"
                value={settings.pharmacy.address}
                onChange={(e) => handleSettingChange('pharmacy', 'address', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pharmacy-phone">Phone</Label>
                <Input
                  id="pharmacy-phone"
                  value={settings.pharmacy.phone}
                  onChange={(e) => handleSettingChange('pharmacy', 'phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pharmacy-email">Email</Label>
                <Input
                  id="pharmacy-email"
                  type="email"
                  value={settings.pharmacy.email}
                  onChange={(e) => handleSettingChange('pharmacy', 'email', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pharmacy-license">License Number</Label>
                <Input
                  id="pharmacy-license"
                  value={settings.pharmacy.license}
                  onChange={(e) => handleSettingChange('pharmacy', 'license', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pharmacy-tax">Tax Number</Label>
                <Input
                  id="pharmacy-tax"
                  value={settings.pharmacy.taxNumber}
                  onChange={(e) => handleSettingChange('pharmacy', 'taxNumber', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* POS Configuration */}
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <span>POS Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync">Auto Sync</Label>
                <p className="text-xs text-muted-foreground">Automatically sync when online</p>
              </div>
              <Switch
                id="auto-sync"
                checked={settings.pos.autoSync}
                onCheckedChange={(checked) => handleSettingChange('pos', 'autoSync', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="offline-mode">Offline Mode</Label>
                <p className="text-xs text-muted-foreground">Allow operations without internet</p>
              </div>
              <Switch
                id="offline-mode"
                checked={settings.pos.offlineMode}
                onCheckedChange={(checked) => handleSettingChange('pos', 'offlineMode', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receipt-printer">Receipt Printer</Label>
              <Input
                id="receipt-printer"
                value={settings.pos.receiptPrinter}
                onChange={(e) => handleSettingChange('pos', 'receiptPrinter', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default-tax">Default Tax (%)</Label>
                <Input
                  id="default-tax"
                  type="number"
                  value={settings.pos.defaultTax}
                  onChange={(e) => handleSettingChange('pos', 'defaultTax', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="low-stock">Low Stock Alert</Label>
                <Input
                  id="low-stock"
                  type="number"
                  value={settings.pos.lowStockAlert}
                  onChange={(e) => handleSettingChange('pos', 'lowStockAlert', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry-alert">Expiry Alert (days)</Label>
                <Input
                  id="expiry-alert"
                  type="number"
                  value={settings.pos.expiryAlert}
                  onChange={(e) => handleSettingChange('pos', 'expiryAlert', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-primary" />
              <span>User Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-semibold text-primary">AK</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{settings.user.name}</h3>
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  {settings.user.role}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">Device: {settings.user.deviceId}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Last Login</Label>
              <p className="text-sm text-muted-foreground">{settings.user.lastLogin}</p>
            </div>
            
            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
              <Button variant="outline" className="w-full">
                Update Profile Picture
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security & Notifications */}
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>Security & Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require-pin">Require PIN for transactions</Label>
                  <p className="text-xs text-muted-foreground">Extra security for sales</p>
                </div>
                <Switch
                  id="require-pin"
                  checked={settings.security.requirePin}
                  onCheckedChange={(checked) => handleSettingChange('security', 'requirePin', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="encrypt-data">Encrypt local data</Label>
                  <p className="text-xs text-muted-foreground">Secure offline storage</p>
                </div>
                <Switch
                  id="encrypt-data"
                  checked={settings.security.encryptData}
                  onCheckedChange={(checked) => handleSettingChange('security', 'encryptData', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="low-stock-notif">Low stock notifications</Label>
                </div>
                <Switch
                  id="low-stock-notif"
                  checked={settings.notifications.lowStock}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'lowStock', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="expiry-notif">Expiry notifications</Label>
                </div>
                <Switch
                  id="expiry-notif"
                  checked={settings.notifications.expiry}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'expiry', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sync-notif">Sync notifications</Label>
                </div>
                <Switch
                  id="sync-notif"
                  checked={settings.notifications.sync}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'sync', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Management */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-primary" />
            <span>Data Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Download className="w-6 h-6" />
              <span>Export Data</span>
              <span className="text-xs text-muted-foreground">Backup all data</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Upload className="w-6 h-6" />
              <span>Import Data</span>
              <span className="text-xs text-muted-foreground">Restore from backup</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <RefreshCw className="w-6 h-6" />
              <span>Factory Reset</span>
              <span className="text-xs text-muted-foreground">Reset all settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;