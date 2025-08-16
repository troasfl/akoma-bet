import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { CredentialInputForm } from '../../../components/credentials/CredentialInputForm';
import { CredentialInput } from '../../../types/credentials';

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  useToast: () => mockToast,
}));

const renderWithChakra = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('CredentialInputForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with all fields', () => {
    renderWithChakra(
      <CredentialInputForm onSubmit={mockOnSubmit} />
    );

    expect(screen.getByText('Add Msport.com Credentials')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save credentials/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithChakra(
      <CredentialInputForm onSubmit={mockOnSubmit} />
    );

    const submitButton = screen.getByRole('button', { name: /save credentials/i });
    
    // The button should be disabled initially since form is invalid
    expect(submitButton).toBeDisabled();
    
    // Try to submit the form by clicking the button
    await act(async () => {
      await user.click(submitButton);
    });

    // Since the button is disabled, the form won't submit, but we can test validation
    // by enabling the button and then submitting
    const usernameInput = screen.getByLabelText(/username/i);
    
    // Fill in one field to make form valid, then clear it to trigger validation
    await act(async () => {
      await user.type(usernameInput, 'test');
      await user.clear(usernameInput);
    });

    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for short username', async () => {
    const user = userEvent.setup();
    renderWithChakra(
      <CredentialInputForm onSubmit={mockOnSubmit} />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    
    await act(async () => {
      await user.type(usernameInput, 'ab');
    });

    await waitFor(() => {
      expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    renderWithChakra(
      <CredentialInputForm onSubmit={mockOnSubmit} />
    );

    const passwordInput = screen.getByLabelText(/password/i);
    
    await act(async () => {
      await user.type(passwordInput, '123');
    });

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockCredentials: CredentialInput = {
      username: 'testuser',
      password: 'testpass123'
    };

    mockOnSubmit.mockResolvedValue(undefined);

    renderWithChakra(
      <CredentialInputForm onSubmit={mockOnSubmit} />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /save credentials/i });

    await act(async () => {
      await user.type(usernameInput, mockCredentials.username);
      await user.type(passwordInput, mockCredentials.password);
    });

    // Wait for form to become valid
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(mockCredentials);
    });
  });

  it('shows loading state when isLoading prop is true', () => {
    renderWithChakra(
      <CredentialInputForm onSubmit={mockOnSubmit} isLoading={true} />
    );

    const submitButton = screen.getByRole('button', { name: /saving credentials/i });
    
    expect(screen.getByText('Saving credentials...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('handles form submission correctly', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    renderWithChakra(
      <CredentialInputForm onSubmit={mockOnSubmit} />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /save credentials/i });

    await act(async () => {
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'testpass123');
    });

    // Wait for form to become valid
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await act(async () => {
      await user.click(submitButton);
    });

    // Verify the form submission was called
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'testpass123'
      });
    });
  });

  it('shows error message when provided', () => {
    const errorMessage = 'Failed to save credentials';
    renderWithChakra(
      <CredentialInputForm onSubmit={mockOnSubmit} error={errorMessage} />
    );

    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows success toast on successful submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    renderWithChakra(
      <CredentialInputForm onSubmit={mockOnSubmit} />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /save credentials/i });

    await act(async () => {
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'testpass123');
    });

    // Wait for form to become valid
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Credentials saved successfully',
        description: 'Your msport.com credentials have been securely stored.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    });
  });

  it('shows error toast on submission failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Network error';
    mockOnSubmit.mockRejectedValue(new Error(errorMessage));

    renderWithChakra(
      <CredentialInputForm onSubmit={mockOnSubmit} />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /save credentials/i });

    await act(async () => {
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'testpass123');
    });

    // Wait for form to become valid
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Failed to save credentials',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });
  });

  it('resets form after successful submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    renderWithChakra(
      <CredentialInputForm onSubmit={mockOnSubmit} />
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /save credentials/i });

    await act(async () => {
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'testpass123');
    });

    // Wait for form to become valid
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(usernameInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
    });
  });
});
