import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Embeddable Booking Widget
 * 
 * Usage on customer website:
 * <div id="gearbox-booking"></div>
 * <script src="https://gearbox.app/widget.js" data-shop-id="1"></script>
 */

interface BookingWidgetProps {
  shopId: string;
  apiUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const BookingWidget: React.FC<BookingWidgetProps> = ({
  shopId,
  apiUrl = 'http://localhost:3000/api/trpc',
  primaryColor = '#2563eb',
  accentColor = '#1e40af',
}) => {
  const [step, setStep] = useState<'service' | 'datetime' | 'details' | 'confirmation'>('service');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [serviceType, setServiceType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleRego, setVehicleRego] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const services = [
    { id: 'oil_change', name: 'Oil Change & Filter', duration: 60 },
    { id: 'wof', name: 'WOF Inspection', duration: 45 },
    { id: 'service', name: 'Full Service', duration: 120 },
    { id: 'brakes', name: 'Brake Service', duration: 90 },
    { id: 'diagnostic', name: 'Diagnostic & Repair', duration: 60 },
  ];

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate && serviceType) {
      fetchAvailability();
    }
  }, [selectedDate, serviceType]);

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const service = services.find(s => s.id === serviceType);
      const response = await fetch(`${apiUrl}/public.availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          date: selectedDate,
          serviceType: service?.name || '',
          serviceDuration: service?.duration || 60,
        }),
      });
      const data = await response.json();
      setAvailableSlots(data.result?.data?.slots || []);
    } catch (err) {
      setError('Failed to load availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const service = services.find(s => s.id === serviceType);
      const response = await fetch(`${apiUrl}/public.createBooking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          customerName,
          customerEmail,
          customerPhone,
          vehicleRegistration: vehicleRego,
          serviceType: service?.name || '',
          preferredDate: selectedDate,
          preferredTime: selectedTime,
          notes,
          captchaToken: 'test-token', // TODO: Implement real CAPTCHA
        }),
      });
      const data = await response.json();
      if (data.result?.data?.success) {
        setBookingConfirmed(true);
        setStep('confirmation');
      } else {
        setError('Failed to create booking. Please try again.');
      }
    } catch (err) {
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
          Book an Appointment
        </h2>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {['service', 'datetime', 'details', 'confirmation'].map((s, idx) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: ['service', 'datetime', 'details', 'confirmation'].indexOf(step) >= idx ? primaryColor : '#e5e7eb',
                borderRadius: '2px',
                transition: 'background-color 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* Step 1: Service Selection */}
      {step === 'service' && (
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
            Select Service
          </label>
          <div style={{ display: 'grid', gap: '12px' }}>
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setServiceType(service.id)}
                style={{
                  padding: '16px',
                  border: serviceType === service.id ? `2px solid ${primaryColor}` : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: serviceType === service.id ? `${primaryColor}10` : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: '600', color: '#1f2937' }}>{service.name}</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  ~{service.duration} minutes
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep('datetime')}
            disabled={!serviceType}
            style={{
              marginTop: '24px',
              width: '100%',
              padding: '12px',
              backgroundColor: serviceType ? primaryColor : '#d1d5db',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: serviceType ? 'pointer' : 'not-allowed',
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2: Date & Time Selection */}
      {step === 'datetime' && (
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
            }}
          />

          {selectedDate && (
            <>
              <label style={{ display: 'block', marginTop: '16px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Select Time
              </label>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  Loading available times...
                </div>
              ) : availableSlots.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      style={{
                        padding: '12px',
                        border: selectedTime === time ? `2px solid ${primaryColor}` : '2px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: selectedTime === time ? `${primaryColor}10` : '#ffffff',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  No available times for this date. Please select another date.
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={() => setStep('service')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
            <button
              onClick={() => setStep('details')}
              disabled={!selectedTime}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: selectedTime ? primaryColor : '#d1d5db',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: selectedTime ? 'pointer' : 'not-allowed',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Customer Details */}
      {step === 'details' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Your Name *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Phone Number *
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+64 21 123 4567"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Email (Optional)
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Vehicle Registration (Optional)
            </label>
            <input
              type="text"
              value={vehicleRego}
              onChange={(e) => setVehicleRego(e.target.value.toUpperCase())}
              placeholder="ABC123"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific concerns or requests..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={() => setStep('datetime')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!customerName || !customerPhone || loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: customerName && customerPhone && !loading ? primaryColor : '#d1d5db',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: customerName && customerPhone && !loading ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 'confirmation' && bookingConfirmed && (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: `${primaryColor}20`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Booking Confirmed!
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            We've sent a confirmation to your phone{customerEmail && ' and email'}.
          </p>
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'left',
            marginBottom: '24px',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <strong>Service:</strong> {services.find(s => s.id === serviceType)?.name}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Time:</strong> {selectedTime}
            </div>
            {vehicleRego && (
              <div>
                <strong>Vehicle:</strong> {vehicleRego}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setStep('service');
              setServiceType('');
              setSelectedDate('');
              setSelectedTime('');
              setCustomerName('');
              setCustomerEmail('');
              setCustomerPhone('');
              setVehicleRego('');
              setNotes('');
              setBookingConfirmed(false);
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ffffff',
              color: primaryColor,
              border: `2px solid ${primaryColor}`,
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Book Another Appointment
          </button>
        </div>
      )}
    </div>
  );
};

// Auto-initialize widget when script loads
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('gearbox-booking');
    const script = document.currentScript as HTMLScriptElement;
    
    if (container && script) {
      const shopId = script.getAttribute('data-shop-id') || '1';
      const apiUrl = script.getAttribute('data-api-url');
      const primaryColor = script.getAttribute('data-primary-color');
      const accentColor = script.getAttribute('data-accent-color');

      const root = createRoot(container);
      root.render(
        <BookingWidget
          shopId={shopId}
          apiUrl={apiUrl || undefined}
          primaryColor={primaryColor || undefined}
          accentColor={accentColor || undefined}
        />
      );
    }
  });
}

export default BookingWidget;
