'use client'
import { useState } from 'react';
import { useTrackingState } from '../hooks/useTrackingState';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

export default function DeleteDataButton() {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const { isEnabled } = useTrackingState();

    const handleDeleteData = async () => {
        try {
            setIsDeleting(true);
            const response = await fetch('/api/delete-user-data', {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete data');
            }

            setShowConfirmation(false);
            alert('Your data has been successfully deleted');
        } catch (error) {
            console.error('Error deleting data:', error);
            alert('Failed to delete data. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-spotify-dark-elevated/50 p-6 rounded-lg">
            <div className="space-y-4">
                <button
                    onClick={() => setShowConfirmation(true)}
                    disabled={isDeleting}
                    className="w-full px-4 py-3 rounded-full bg-red-600 text-white 
                             hover:bg-red-700 transition-colors disabled:opacity-50 
                             disabled:cursor-not-allowed font-bold"
                >
                    {isDeleting ? 'Deleting...' : 'Delete All My Data'}
                </button>
            </div>

            <DeleteConfirmationModal 
                isOpen={showConfirmation} 
                onClose={() => setShowConfirmation(false)}
            >
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">
                            Delete All Data
                        </h3>
                        <p className="text-sm text-gray-400">
                            Are you sure you want to delete all your listening history?
                        </p>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 space-y-2">
                        <p className="text-sm text-red-400 font-medium">
                            Warning:
                        </p>
                        <p className="text-sm text-gray-300">
                            This action cannot be undone. All your listening history will be permanently deleted.
                        </p>
                        {isEnabled && (
                            <p className="text-sm text-gray-400 mt-2">
                                Note: Tracking is currently enabled and new data will continue to be collected after deletion.
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleDeleteData}
                            disabled={isDeleting}
                            className="w-full px-4 py-3 rounded-full bg-red-600 
                                     hover:bg-red-700 transition-colors text-white 
                                     font-bold disabled:opacity-50 
                                     disabled:cursor-not-allowed"
                        >
                            {isDeleting ? 'Deleting...' : 'Yes, Delete All My Data'}
                        </button>
                        <button
                            onClick={() => setShowConfirmation(false)}
                            className="w-full px-4 py-3 rounded-full bg-gray-700 
                                     hover:bg-gray-600 transition-colors text-white 
                                     font-bold"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </DeleteConfirmationModal>
        </div>
    );
}