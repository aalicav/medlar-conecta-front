'use client';

import { useState, useEffect } from 'react';
import { Card, Checkbox, Button, Typography, Divider, message } from 'antd';
import { privacyService } from '../../app/services/privacyService';
import { DataConsent, ConsentType, PrivacyPolicyInfo } from '../../app/types/privacy';

const { Title, Paragraph, Text } = Typography;

interface ConsentFormProps {
  userId?: number;
  onComplete?: () => void;
  requiredOnly?: boolean;
}

export default function ConsentForm({ userId, onComplete, requiredOnly = false }: ConsentFormProps) {
  const [consents, setConsents] = useState<DataConsent[]>([]);
  const [policyInfo, setPolicyInfo] = useState<PrivacyPolicyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [consentsRes, policyRes] = await Promise.all([
          privacyService.getConsents(),
          privacyService.getPrivacyInfo()
        ]);
        
        setConsents(consentsRes.data);
        setPolicyInfo(policyRes.data);
      } catch (error) {
        console.error('Error loading consent data:', error);
        message.error('Failed to load privacy consent information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleConsentChange = async (consentType: string, value: boolean, consentText: string) => {
    try {
      setSaving(true);
      const existingConsent = consents.find(c => c.consent_type === consentType);
      
      if (existingConsent) {
        if (existingConsent.consent_given !== value) {
          if (value) {
            // Update consent to true
            await privacyService.storeConsent({
              consent_type: consentType,
              consent_given: true,
              consent_text: consentText
            });
          } else {
            // Revoke consent
            await privacyService.revokeConsent(existingConsent.id);
          }
          
          // Update local state
          setConsents(prev => prev.map(c => 
            c.consent_type === consentType ? { ...c, consent_given: value } : c
          ));
        }
      } else if (value) {
        // Create new consent
        const result = await privacyService.storeConsent({
          consent_type: consentType,
          consent_given: true,
          consent_text: consentText
        });
        
        // Add to local state
        setConsents(prev => [...prev, result.data]);
      }
    } catch (error) {
      console.error('Error updating consent:', error);
      message.error('Failed to update consent preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    // Check if all required consents are given
    if (policyInfo) {
      const requiredConsents = policyInfo.consent_types.filter(c => c.is_required);
      const allRequiredConsentsGiven = requiredConsents.every(required => {
        const existingConsent = consents.find(c => c.consent_type === required.id);
        return existingConsent && existingConsent.consent_given;
      });
      
      if (!allRequiredConsentsGiven) {
        message.error('Please accept all required consents to continue');
        return;
      }
      
      message.success('Privacy preferences saved successfully');
      if (onComplete) onComplete();
    }
  };

  if (loading) {
    return <div>Loading privacy consent information...</div>;
  }

  if (!policyInfo) {
    return <div>Unable to load privacy information. Please try again later.</div>;
  }

  return (
    <Card>
      <Title level={4}>Privacy Consent Settings</Title>
      <Paragraph>
        Last updated: {policyInfo.last_updated} | Version: {policyInfo.policy_version}
      </Paragraph>
      
      <Divider />
      
      {policyInfo.consent_types
        .filter(consentType => !requiredOnly || consentType.is_required)
        .map(consentType => {
          const existingConsent = consents.find(c => c.consent_type === consentType.id);
          const isChecked = existingConsent ? existingConsent.consent_given : false;
          
          return (
            <div key={consentType.id} style={{ marginBottom: 16 }}>
              <Checkbox 
                checked={isChecked}
                onChange={e => handleConsentChange(consentType.id, e.target.checked, consentType.description)}
                disabled={saving || (consentType.is_required && isChecked)}
              >
                <Text strong>{consentType.name}</Text>
                {consentType.is_required && <Text type="danger"> (Required)</Text>}
              </Checkbox>
              <Paragraph style={{ marginLeft: 24 }}>
                {consentType.description}
              </Paragraph>
            </div>
          );
        })}
      
      <Divider />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          type="primary" 
          onClick={handleSubmit} 
          loading={saving}
        >
          Save Preferences
        </Button>
      </div>
    </Card>
  );
} 