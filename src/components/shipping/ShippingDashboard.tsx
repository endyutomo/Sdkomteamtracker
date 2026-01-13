import { useState, useEffect } from 'react';
import {
    Plus,
    Package,
    Truck,
    CheckCircle,
    Clock,
    RefreshCw,
    Search,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useShipping } from '@/hooks/useShipping';
import { useAuth } from '@/hooks/useAuth';
import { ShipmentList } from './ShipmentList';
import { ShipmentForm } from './ShipmentForm';
import { DriverBookingForm } from './DriverBookingForm';
import { ShipmentStatusUpdater } from './ShipmentStatusUpdater';
import { Shipment, ShippingStatus, ShipmentTracking } from '@/types/shipping';
import { DivisionType } from '@/hooks/useProfile';

interface ShippingDashboardProps {
    userDivision?: DivisionType;
    isManager?: boolean;
}

export function ShippingDashboard({ userDivision, isManager }: ShippingDashboardProps) {
    const { user } = useAuth();
    const {
        shipments,
        loading,
        addShipment,
        updateShipment,
        updateShipmentStatus,
        deleteShipment,
        bookDriver,
        getTrackingHistory,
        getAvailableDrivers,
        getMyAssignedShipments,
        getStats,
        refetch,
    } = useShipping();

    const [showForm, setShowForm] = useState(false);
    const [editShipment, setEditShipment] = useState<Shipment | null>(null);
    const [bookingShipment, setBookingShipment] = useState<Shipment | null>(null);
    const [trackingShipment, setTrackingShipment] = useState<Shipment | null>(null);
    const [trackingHistory, setTrackingHistory] = useState<ShipmentTracking[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const stats = getStats();
    const isDriver = userDivision === 'logistic';
    const myAssignedShipments = getMyAssignedShipments();

    // Filter shipments
    const filteredShipments = shipments.filter((s) => {
        const matchesSearch =
            s.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.itemDescription.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Handle refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
    };

    // Handle view/track shipment
    const handleTrack = async (shipment: Shipment) => {
        setTrackingShipment(shipment);
        const history = await getTrackingHistory(shipment.id);
        setTrackingHistory(history);
    };

    // Handle edit
    const handleEdit = (shipment: Shipment) => {
        setEditShipment(shipment);
        setShowForm(true);
    };

    // Handle form submit
    const handleFormSubmit = async (data: any) => {
        if (editShipment) {
            const success = await updateShipment(editShipment.id, data);
            if (success) {
                setEditShipment(null);
                setShowForm(false);
                return editShipment;
            }
            return null;
        }
        return addShipment(data);
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Pengiriman</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Menunggu Driver</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
                        <Truck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Terkirim</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue={isDriver ? 'my-shipments' : 'all'} className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <TabsList>
                        {isDriver && (
                            <TabsTrigger value="my-shipments">
                                Pengiriman Saya ({myAssignedShipments.length})
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="all">Semua Pengiriman</TabsTrigger>
                        <TabsTrigger value="pending">Menunggu Driver</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button onClick={() => { setEditShipment(null); setShowForm(true); }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Pengiriman
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari pengiriman..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="pending">Menunggu Driver</SelectItem>
                            <SelectItem value="booked">Driver Terbooking</SelectItem>
                            <SelectItem value="picked_up">Barang Diambil</SelectItem>
                            <SelectItem value="in_transit">Dalam Perjalanan</SelectItem>
                            <SelectItem value="delivered">Terkirim</SelectItem>
                            <SelectItem value="cancelled">Dibatalkan</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* My Shipments (Driver only) */}
                {isDriver && (
                    <TabsContent value="my-shipments">
                        <ShipmentList
                            shipments={myAssignedShipments.filter(s =>
                                s.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                s.recipientName.toLowerCase().includes(searchQuery.toLowerCase())
                            )}
                            onView={handleTrack}
                            onEdit={handleEdit}
                            onDelete={deleteShipment}
                            onTrack={handleTrack}
                            isManager={isManager}
                            currentUserId={user?.id}
                        />
                    </TabsContent>
                )}

                {/* All Shipments */}
                <TabsContent value="all">
                    <ShipmentList
                        shipments={filteredShipments}
                        onView={handleTrack}
                        onEdit={handleEdit}
                        onDelete={deleteShipment}
                        onBookDriver={(s) => setBookingShipment(s)}
                        onTrack={handleTrack}
                        isManager={isManager}
                        currentUserId={user?.id}
                    />
                </TabsContent>

                {/* Pending Shipments */}
                <TabsContent value="pending">
                    <ShipmentList
                        shipments={shipments.filter(s =>
                            s.status === 'pending' &&
                            (s.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                s.recipientName.toLowerCase().includes(searchQuery.toLowerCase()))
                        )}
                        onView={handleTrack}
                        onEdit={handleEdit}
                        onDelete={deleteShipment}
                        onBookDriver={(s) => setBookingShipment(s)}
                        onTrack={handleTrack}
                        isManager={isManager}
                        currentUserId={user?.id}
                    />
                </TabsContent>
            </Tabs>

            {/* Forms & Dialogs */}
            <ShipmentForm
                open={showForm}
                onClose={() => { setShowForm(false); setEditShipment(null); }}
                onSubmit={handleFormSubmit}
                editShipment={editShipment}
            />

            <DriverBookingForm
                open={!!bookingShipment}
                onClose={() => setBookingShipment(null)}
                onSubmit={bookDriver}
                shipment={bookingShipment}
                availableDrivers={getAvailableDrivers()}
            />

            <ShipmentStatusUpdater
                open={!!trackingShipment}
                onClose={() => { setTrackingShipment(null); setTrackingHistory([]); }}
                shipment={trackingShipment}
                trackingHistory={trackingHistory}
                onUpdateStatus={updateShipmentStatus}
                isDriver={isDriver && trackingShipment?.driverId === user?.id}
            />
        </div>
    );
}
