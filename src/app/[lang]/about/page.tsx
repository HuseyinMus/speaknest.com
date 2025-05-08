'use client';

import React from 'react';
import Header from '@/components/Header';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {/* {t('aboutTitle')} */}
              Hakkımızda
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {/* {t('aboutDescription')} */}
              Hakkımızda açıklaması burada olacak
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {/* {t('ourMission')} */}
                Vizyonumuz
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                {/* {t('missionDescription')} */}
                Vizyonumuzun açıklaması burada olacak
              </p>
              <p className="text-lg text-gray-600">
                {/* {t('missionDescription2')} */}
                Vizyonumuzun ikinci açıklaması burada olacak
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {/* {t('ourValues')} */}
                Değerlerimiz
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">{/* {t('value1Title')} */}Değer 1</h4>
                    <p className="mt-2 text-gray-600">{/* {t('value1Description')} */}Değer 1'in açıklaması burada olacak</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">{/* {t('value2Title')} */}Değer 2</h4>
                    <p className="mt-2 text-gray-600">{/* {t('value2Description')} */}Değer 2'nin açıklaması burada olacak</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">{/* {t('value3Title')} */}Değer 3</h4>
                    <p className="mt-2 text-gray-600">{/* {t('value3Description')} */}Değer 3'ün açıklaması burada olacak</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {/* {t('ourTeam')} */}
              Ekip
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              {/* {t('teamDescription')} */}
              Ekip açıklaması burada olacak
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <img
                    src="/images/team-1.jpg"
                    alt="Team Member"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{/* {t('teamMember1Name')} */}Ekip Üyesi 1</h3>
                <p className="text-gray-600">{/* {t('teamMember1Role')} */}Ekip Üyesi 1'in rolü burada olacak</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <img
                    src="/images/team-2.jpg"
                    alt="Team Member"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{/* {t('teamMember2Name')} */}Ekip Üyesi 2</h3>
                <p className="text-gray-600">{/* {t('teamMember2Role')} */}Ekip Üyesi 2'nin rolü burada olacak</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <img
                    src="/images/team-3.jpg"
                    alt="Team Member"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{/* {t('teamMember3Name')} */}Ekip Üyesi 3</h3>
                <p className="text-gray-600">{/* {t('teamMember3Role')} */}Ekip Üyesi 3'ün rolü burada olacak</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 