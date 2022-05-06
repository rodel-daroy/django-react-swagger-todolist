import React from 'react';
import { useLocation } from 'react-router-dom';

export const useCompositeState = initialState => {
    const [state, _setState] = React.useState(initialState);
    return [
        state,
        React.useCallback(newState => _setState(prevState => ({...prevState, ...newState})), [])
    ];
};

export const useQuery = () => (new URLSearchParams(useLocation().search));

