import React, { useState, useEffect } from "react";
import { Cpu, RefreshCw, Download, CheckCircle, XCircle } from "lucide-react";
import {
  getServiceWorkerInfo,
  canWorkOffline,
} from "../utils/ServiceWorkerChecker";
import "./ServiceWorkerStatus.css";

interface ServiceWorkerStatusProps {
  className?: string;
}

const ServiceWorkerStatus: React.FC<ServiceWorkerStatusProps> = ({
  className = "",
}) => {
  const [swInfo, setSwInfo] = useState<{
    supported: boolean;
    registered: boolean;
    active: boolean;
    waiting: boolean;
    installing: boolean;
    controller: boolean;
    scope?: string;
    scriptURL?: string;
    state?: string;
  } | null>(null);

  const [canWork, setCanWork] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const info = await getServiceWorkerInfo();
      setSwInfo(info);

      const offlineCapable = await canWorkOffline();
      setCanWork(offlineCapable);
    } catch (error) {
      console.error("Error checking service worker status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleRefresh = () => {
    checkStatus();
  };

  const handleUpdate = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className={`sw-status-card ${className}`}>
        <div className="sw-status-header">
          <Cpu size={20} />
          <h3>Service Worker Status</h3>
        </div>
        <div className="sw-status-loading">
          <RefreshCw size={20} className="sw-loading-icon" />
          <p>Checking service worker status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`sw-status-card ${className}`}>
      <div className="sw-status-header">
        <Cpu size={20} />
        <h3>Service Worker Status</h3>
        <button
          className="sw-refresh-button"
          onClick={handleRefresh}
          aria-label="Refresh status"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="sw-status-content">
        <div className="sw-status-item">
          <span className="sw-status-label">Supported:</span>
          <span className="sw-status-value">
            {swInfo?.supported ? (
              <CheckCircle size={16} className="sw-status-icon success" />
            ) : (
              <XCircle size={16} className="sw-status-icon error" />
            )}
            {swInfo?.supported ? "Yes" : "No"}
          </span>
        </div>

        <div className="sw-status-item">
          <span className="sw-status-label">Registered:</span>
          <span className="sw-status-value">
            {swInfo?.registered ? (
              <CheckCircle size={16} className="sw-status-icon success" />
            ) : (
              <XCircle size={16} className="sw-status-icon error" />
            )}
            {swInfo?.registered ? "Yes" : "No"}
          </span>
        </div>

        <div className="sw-status-item">
          <span className="sw-status-label">Active:</span>
          <span className="sw-status-value">
            {swInfo?.active ? (
              <CheckCircle size={16} className="sw-status-icon success" />
            ) : (
              <XCircle size={16} className="sw-status-icon error" />
            )}
            {swInfo?.active ? "Yes" : "No"}
          </span>
        </div>

        <div className="sw-status-item">
          <span className="sw-status-label">Offline Capable:</span>
          <span className="sw-status-value">
            {canWork ? (
              <CheckCircle size={16} className="sw-status-icon success" />
            ) : (
              <XCircle size={16} className="sw-status-icon error" />
            )}
            {canWork ? "Yes" : "No"}
          </span>
        </div>

        {swInfo?.waiting && (
          <div className="sw-status-update">
            <p>A new version is available!</p>
            <button className="sw-update-button" onClick={handleUpdate}>
              <Download size={16} />
              Update Now
            </button>
          </div>
        )}

        {swInfo?.scope && (
          <div className="sw-status-detail">
            <span className="sw-status-label">Scope:</span>
            <span className="sw-status-value">{swInfo.scope}</span>
          </div>
        )}

        {swInfo?.state && (
          <div className="sw-status-detail">
            <span className="sw-status-label">State:</span>
            <span className="sw-status-value">{swInfo.state}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceWorkerStatus;
