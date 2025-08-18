'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ModalType = 'auth' | null;

interface ModalContextType {
  modal: ModalType;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modal, setModal] = useState<ModalType>(null);

  const openModal = (type: ModalType) => setModal(type);
  const closeModal = () => setModal(null);

  const value = { modal, openModal, closeModal };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};