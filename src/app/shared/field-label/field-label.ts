import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import {
  LucideArrowDownLeft,
  LucideArrowUpRight,
  LucideBanknote,
  LucideBriefcase,
  LucideBuilding,
  LucideBuilding2,
  LucideCalendar,
  LucideCalendarClock,
  LucideCircleDot,
  LucideClock,
  LucideCoins,
  LucideFileText,
  LucideFilter,
  LucideGlobe,
  LucideHash,
  LucideHome,
  LucideIdCard,
  LucideLandmark,
  LucideLayers,
  LucideLayoutGrid,
  LucideLink,
  LucideList,
  LucideMail,
  LucidePackage,
  LucidePenLine,
  LucidePercent,
  LucidePhone,
  LucideScrollText,
  LucideTags,
  LucideUser,
  LucideUserCircle,
  LucideUsers,
  LucideWallet,
} from '@lucide/angular';
import { FieldLabelIcon, FieldLabelVariant } from './field-label.model';

@Component({
  selector: 'app-field-label',
  imports: [
    NgTemplateOutlet,
    LucideHash,
    LucideLandmark,
    LucideUser,
    LucideBuilding2,
    LucidePackage,
    LucideCoins,
    LucideBanknote,
    LucideCalendar,
    LucideCalendarClock,
    LucideFileText,
    LucideWallet,
    LucideScrollText,
    LucideUsers,
    LucideTags,
    LucideList,
    LucideLayers,
    LucideFilter,
    LucideCircleDot,
    LucideClock,
    LucideUserCircle,
    LucidePercent,
    LucideLink,
    LucideArrowDownLeft,
    LucideArrowUpRight,
    LucidePenLine,
    LucidePhone,
    LucideMail,
    LucideHome,
    LucideGlobe,
    LucideIdCard,
    LucideBuilding,
    LucideBriefcase,
    LucideLayoutGrid,
  ],
  template: `
    @if (!asSpan()) {
      <label [attr.for]="forId() || null" class="field-label" [class.is-compact]="compact()">
        <ng-container *ngTemplateOutlet="content" />
      </label>
    } @else {
      <span class="field-label" [class.is-compact]="compact()">
        <ng-container *ngTemplateOutlet="content" />
      </span>
    }

    <ng-template #content>
      <span class="label-icon is-{{ resolvedVariant() }}" aria-hidden="true">
        @switch (icon()) {
          @case ('hash') {
            <svg lucideHash size="14"></svg>
          }
          @case ('account') {
            <svg lucideLandmark size="14"></svg>
          }
          @case ('user') {
            <svg lucideUser size="14"></svg>
          }
          @case ('branch') {
            <svg lucideBuilding2 size="14"></svg>
          }
          @case ('product') {
            <svg lucidePackage size="14"></svg>
          }
          @case ('currency') {
            <svg lucideCoins size="14"></svg>
          }
          @case ('amount') {
            <svg lucideBanknote size="14"></svg>
          }
          @case ('calendar') {
            <svg lucideCalendar size="14"></svg>
          }
          @case ('value') {
            <svg lucideCalendarClock size="14"></svg>
          }
          @case ('voucher') {
            <svg lucideFileText size="14"></svg>
          }
          @case ('doc') {
            <svg lucideFileText size="14"></svg>
          }
          @case ('funds') {
            <svg lucideWallet size="14"></svg>
          }
          @case ('narration') {
            <svg lucideScrollText size="14"></svg>
          }
          @case ('detail') {
            <svg lucideScrollText size="14"></svg>
          }
          @case ('users') {
            <svg lucideUsers size="14"></svg>
          }
          @case ('type') {
            <svg lucideTags size="14"></svg>
          }
          @case ('list') {
            <svg lucideList size="14"></svg>
          }
          @case ('denom') {
            <svg lucideCoins size="14"></svg>
          }
          @case ('batch') {
            <svg lucideLayers size="14"></svg>
          }
          @case ('filter') {
            <svg lucideFilter size="14"></svg>
          }
          @case ('status') {
            <svg lucideCircleDot size="14"></svg>
          }
          @case ('clock') {
            <svg lucideClock size="14"></svg>
          }
          @case ('customer') {
            <svg lucideUserCircle size="14"></svg>
          }
          @case ('rate') {
            <svg lucidePercent size="14"></svg>
          }
          @case ('link') {
            <svg lucideLink size="14"></svg>
          }
          @case ('debit') {
            <svg lucideArrowDownLeft size="14"></svg>
          }
          @case ('credit') {
            <svg lucideArrowUpRight size="14"></svg>
          }
          @case ('title') {
            <svg lucidePenLine size="14"></svg>
          }
          @case ('gender') {
            <svg lucideUser size="14"></svg>
          }
          @case ('phone') {
            <svg lucidePhone size="14"></svg>
          }
          @case ('mail') {
            <svg lucideMail size="14"></svg>
          }
          @case ('home') {
            <svg lucideHome size="14"></svg>
          }
          @case ('globe') {
            <svg lucideGlobe size="14"></svg>
          }
          @case ('id') {
            <svg lucideIdCard size="14"></svg>
          }
          @case ('building') {
            <svg lucideBuilding size="14"></svg>
          }
          @case ('briefcase') {
            <svg lucideBriefcase size="14"></svg>
          }
          @case ('vault') {
            <svg lucideLandmark size="14"></svg>
          }
          @case ('layout') {
            <svg lucideLayoutGrid size="14"></svg>
          }
          @case ('signature') {
            <svg lucidePenLine size="14"></svg>
          }
          @default {
            <svg lucideCircleDot size="14"></svg>
          }
        }
      </span>
      <span class="label-text">
        @if (required()) {
          <span class="req">*</span>
        }
        {{ text() }}
        <ng-content />
      </span>
    </ng-template>
  `,
})
export class FieldLabel {
  readonly forId = input('');
  readonly icon = input<FieldLabelIcon>('default');
  readonly variant = input<FieldLabelVariant | ''>('');
  readonly required = input(false);
  readonly text = input('');
  readonly asSpan = input(false);
  readonly compact = input(false);

  readonly resolvedVariant = computed(() => {
    const explicit = this.variant();
    if (explicit) {
      return explicit;
    }
    const ic = this.icon();
    if (ic === 'hash') {
      return 'trans';
    }
    if (ic === 'user') {
      return 'name';
    }
    if (ic === 'doc') {
      return 'doc-ref';
    }
    if (ic === 'list') {
      return 'detail-alt';
    }
    if (ic === 'calendar') {
      return 'posting';
    }
    return ic;
  });
}
