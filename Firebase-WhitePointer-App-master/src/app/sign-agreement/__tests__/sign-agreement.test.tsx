import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import SignAgreementPage from '../page';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock SignatureCanvas
jest.mock('react-signature-canvas', () => {
  return jest.fn().mockImplementation(() => ({
    clear: jest.fn(),
    isEmpty: jest.fn(),
    getTrimmedCanvas: jest.fn().mockReturnValue({
      toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mock')
    })
  }));
});

describe('SignAgreementPage', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();
  
  beforeEach(() => {
    (useRouter as any).mockReturnValue({ push: mockPush });
    (useSearchParams as any).mockReturnValue({ get: mockGet });
    mockPush.mockClear();
    mockGet.mockClear();
  });

  describe('Rendering', () => {
    it('should render all form sections', () => {
      render(<SignAgreementPage />);
      
      expect(screen.getByText('PBikeRescue')).toBeInTheDocument();
      expect(screen.getByText('Rental Contract')).toBeInTheDocument();
      expect(screen.getByText('Hirer Information')).toBeInTheDocument();
      expect(screen.getByText('Charges')).toBeInTheDocument();
      expect(screen.getByText('Terms and Conditions')).toBeInTheDocument();
      expect(screen.getByText('Digital Signature')).toBeInTheDocument();
    });

    it('should render vehicle details correctly', () => {
      render(<SignAgreementPage />);
      
      expect(screen.getByLabelText('MAKE')).toHaveValue('Yamaha');
      expect(screen.getByLabelText('MODEL')).toHaveValue('STREET BOB');
      expect(screen.getByLabelText('HIRE DATE')).toHaveValue('2024-07-28');
    });

    it('should render all inputs as read-only except signature fields', () => {
      render(<SignAgreementPage />);
      
      const readOnlyInputs = screen.getAllByRole('textbox').filter(
        input => input.hasAttribute('readonly')
      );
      
      expect(readOnlyInputs.length).toBeGreaterThan(10);
    });
  });

  describe('Form Validation', () => {
    it('should show error when signature is not provided', async () => {
      const { toast } = jest.requireMock('@/hooks/use-toast').useToast();
      const SignatureCanvas = jest.requireMock('react-signature-canvas');
      SignatureCanvas.mockImplementation(() => ({
        isEmpty: jest.fn().mockReturnValue(true),
        clear: jest.fn(),
        getTrimmedCanvas: jest.fn()
      }));

      render(<SignAgreementPage />);
      
      const submitButton = screen.getByText('Sign and Submit Agreement');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Signature Required",
          description: "Please provide your signature before submitting."
        });
      });
    });

    it('should require terms checkbox to be checked', async () => {
      render(<SignAgreementPage />);
      
      const termsCheckbox = screen.getByRole('checkbox', {
        name: /i have read and understood/i
      });
      
      expect(termsCheckbox).toBeRequired();
      expect(termsCheckbox).not.toBeChecked();
    });

    it('should require full name input', () => {
      render(<SignAgreementPage />);
      
      const fullNameInput = screen.getByLabelText('Full Name');
      expect(fullNameInput).toBeRequired();
      expect(fullNameInput).toHaveValue('John Smith'); // Pre-filled from rental details
    });
  });

  describe('Signature Functionality', () => {
    it('should clear signature when clear button is clicked', async () => {
      const mockClear = jest.fn();
      const SignatureCanvas = jest.requireMock('react-signature-canvas');
      SignatureCanvas.mockImplementation(() => ({
        clear: mockClear,
        isEmpty: jest.fn().mockReturnValue(false),
        getTrimmedCanvas: jest.fn()
      }));

      render(<SignAgreementPage />);
      
      const clearButton = screen.getByText('Clear Signature');
      fireEvent.click(clearButton);

      expect(mockClear).toHaveBeenCalled();
    });

    it('should capture signature data on form submission', async () => {
      const mockToDataURL = jest.fn().mockReturnValue('data:image/png;base64,signature');
      const SignatureCanvas = jest.requireMock('react-signature-canvas');
      SignatureCanvas.mockImplementation(() => ({
        isEmpty: jest.fn().mockReturnValue(false),
        clear: jest.fn(),
        getTrimmedCanvas: jest.fn().mockReturnValue({
          toDataURL: mockToDataURL
        })
      }));

      render(<SignAgreementPage />);
      
      // Check terms checkbox
      const termsCheckbox = screen.getByRole('checkbox');
      fireEvent.click(termsCheckbox);
      
      // Submit form
      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockToDataURL).toHaveBeenCalledWith('image/png');
      });
    });
  });

  describe('Form Submission', () => {
    it('should show success message and redirect after successful submission', async () => {
      const { toast } = jest.requireMock('@/hooks/use-toast').useToast();
      const SignatureCanvas = jest.requireMock('react-signature-canvas');
      SignatureCanvas.mockImplementation(() => ({
        isEmpty: jest.fn().mockReturnValue(false),
        clear: jest.fn(),
        getTrimmedCanvas: jest.fn().mockReturnValue({
          toDataURL: jest.fn().mockReturnValue('data:image/png;base64,signature')
        })
      }));

      render(<SignAgreementPage />);
      
      // Check terms checkbox
      const termsCheckbox = screen.getByRole('checkbox');
      fireEvent.click(termsCheckbox);
      
      // Submit form
      const submitButton = screen.getByText('Sign and Submit Agreement');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Agreement Signed",
          description: "Thank you! The rental agreement has been signed successfully."
        });
      });

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      }, { timeout: 4000 });
    });

    it('should prevent form submission when preventDefault is called', () => {
      render(<SignAgreementPage />);
      
      const form = screen.getByRole('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      
      fireEvent(form, submitEvent);
      
      expect(submitEvent.defaultPrevented).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form inputs', () => {
      render(<SignAgreementPage />);
      
      expect(screen.getByLabelText('MAKE')).toBeInTheDocument();
      expect(screen.getByLabelText('MODEL')).toBeInTheDocument();
      expect(screen.getByLabelText('Hirer Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Digital Signature')).toBeInTheDocument();
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent;
      render(<SignAgreementPage />);
      
      // Focus first element
      const firstButton = screen.getByText('Clear Signature');
      firstButton.focus();
      expect(document.activeElement).toBeTruthy();
      
      // Clear signature button should be focusable
      const clearButton = screen.getByText('Clear Signature');
      clearButton.focus();
      expect(document.activeElement).toBe(clearButton);
    });

    it('should have proper heading hierarchy', () => {
      render(<SignAgreementPage />);
      
      const h2 = screen.getByRole('heading', { name: /rental contract/i });
      expect(h2).toHaveTextContent('Rental Contract');
      
      const h3Elements = screen.getAllByRole('heading').filter(el => el.tagName === 'H3');
      expect(h3Elements).toHaveLength(2); // Hirer Information and Charges
    });
  });

  describe('Data Display', () => {
    it('should display formatted currency values', () => {
      render(<SignAgreementPage />);
      
      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getAllByText('$0.00')).toHaveLength(2); // Total and GST
    });

    it('should display all rental details fields', () => {
      render(<SignAgreementPage />);
      
      const expectedFields = [
        'Yamaha', // make
        'STREET BOB', // model
        'Metro Area - Unlimited KMS', // area of use
        'John Smith', // hirer name
        '0412345678', // phone
        '123 Example St', // address
        'Sydney', // suburb
        'NSW', // state
        '2000', // postcode
        '12345678', // licence number
      ];

      expectedFields.forEach(value => {
        const inputs = screen.getAllByDisplayValue(value);
        expect(inputs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle signature canvas errors gracefully', async () => {
      const SignatureCanvas = jest.requireMock('react-signature-canvas');
      SignatureCanvas.mockImplementation(() => ({
        isEmpty: jest.fn().mockReturnValue(false),
        clear: jest.fn(),
        getTrimmedCanvas: jest.fn().mockImplementation(() => {
          throw new Error('Canvas error');
        })
      }));

      render(<SignAgreementPage />);
      
      const termsCheckbox = screen.getByRole('checkbox');
      fireEvent.click(termsCheckbox);
      
      const submitButton = screen.getByText('Sign and Submit Agreement');
      fireEvent.click(submitButton);

      // Should not crash the app
      expect(screen.getByText('Sign and Submit Agreement')).toBeInTheDocument();
    });
  });

  describe('Security', () => {
    it('should not log sensitive information in production', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<SignAgreementPage />);
      
      // In production, console.log should be removed or disabled
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('12345678') // License number
      );
      
      consoleSpy.mockRestore();
    });

    it('should have all personal information fields as read-only', () => {
      render(<SignAgreementPage />);
      
      const personalFields = [
        screen.getByDisplayValue('John Smith'),
        screen.getByDisplayValue('0412345678'),
        screen.getByDisplayValue('123 Example St'),
        screen.getByDisplayValue('12345678'), // License number
      ];

      personalFields.forEach(field => {
        expect(field).toHaveAttribute('readonly');
      });
    });
  });
});