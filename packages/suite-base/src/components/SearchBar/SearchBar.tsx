// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, TextField, InputAdornment } from "@mui/material";
import { TextFieldProps } from "@mui/material/TextField";
import { PropsWithChildren } from "react";

import { useStyles } from "@lichtblick/suite-base/components/SearchBar/SearchBar.style";

function SearchBar(
  props: PropsWithChildren<
    TextFieldProps & {
      onClear?: () => void;
      showClearIcon?: boolean;
      startAdornment?: React.ReactNode;
    }
  >,
): React.JSX.Element {
  const {
    id = "search-bar",
    variant = "filled",
    disabled = false,
    value,
    onChange,
    onClear,
    showClearIcon = false,
    startAdornment = <SearchIcon fontSize="small" data-testid="SearchIcon" />,
    ...rest
  } = props;

  const { classes } = useStyles();

  return (
    <div className={classes.filterSearchBar}>
      <TextField
        data-testid="SearchBarComponent"
        id={id}
        variant={variant}
        disabled={disabled}
        value={value}
        onChange={onChange}
        fullWidth
        InputProps={{
          ...rest.InputProps,
          startAdornment: (
            <InputAdornment className={classes.filterStartAdornment} position="start">
              {startAdornment}
            </InputAdornment>
          ),
          endAdornment: showClearIcon && (
            <InputAdornment position="end">
              <IconButton size="small" title="Clear" onClick={onClear} edge="end">
                <ClearIcon fontSize="small" data-testid="ClearIcon" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        {...rest}
      />
    </div>
  );
}

export default SearchBar;
